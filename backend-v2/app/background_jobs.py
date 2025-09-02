"""
Background Jobs for Order Management
Handles automatic order status updates and scheduled tasks
"""

import asyncio
from datetime import datetime, timedelta
from typing import List
import pytz
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.order import Order
from app.schemas.order import OrderStatus

logger = get_logger(__name__)

# IST timezone
IST = pytz.timezone('Asia/Kolkata')

class BackgroundJobManager:
    """Manages background jobs for order processing"""
    
    def __init__(self):
        self.running = False
        self.job_interval = 60  # Check every minute
        
    async def start(self):
        """Start the background job manager"""
        if self.running:
            return
            
        self.running = True
        logger.info("Starting background job manager")
        
        # Start the main job loop
        asyncio.create_task(self._job_loop())
        
    async def stop(self):
        """Stop the background job manager"""
        self.running = False
        logger.info("Stopping background job manager")
        
    async def _job_loop(self):
        """Main job processing loop"""
        while self.running:
            try:
                await self._process_pending_orders()
                await asyncio.sleep(self.job_interval)
            except Exception as e:
                logger.error(f"Error in background job loop: {e}")
                await asyncio.sleep(self.job_interval)
                
    async def _process_pending_orders(self):
        """Process pending orders and update status if needed"""
        try:
            db = next(get_db())
            
            # Get current time in IST
            current_time_ist = datetime.now(IST)
            
            # Find orders that are PENDING for more than 5 minutes
            cutoff_time_ist = current_time_ist - timedelta(minutes=5)
            
            # Since database now stores IST timestamps, compare directly with IST
            # Remove timezone info for database comparison (database stores naive datetime in IST)
            cutoff_time_naive = cutoff_time_ist.replace(tzinfo=None)
            
            pending_orders = db.query(Order).filter(
                Order.status == OrderStatus.PENDING,
                Order.created_at <= cutoff_time_naive
            ).all()
            
            logger.info(f"Background job checking {len(pending_orders)} pending orders older than {cutoff_time_naive}")
            
            updated_count = 0
            for order in pending_orders:
                # Refresh order from DB to get latest status
                db.refresh(order)
                
                # Skip if order is no longer PENDING (might have been cancelled)
                if order.status != OrderStatus.PENDING:
                    logger.info(f"Skipping order #{order.id} - status changed to {order.status}")
                    continue
                
                # Double-check the age calculation to ensure we only process orders > 5 minutes old
                order_created_ist = IST.localize(order.created_at)
                age_seconds = (current_time_ist - order_created_ist).total_seconds()
                age_minutes = age_seconds / 60
                
                if age_minutes <= 5:
                    logger.info(f"Skipping order #{order.id} - only {age_minutes:.1f} minutes old")
                    continue
                
                logger.info(
                    f"Auto-updating order #{order.id} from PENDING to PROCESSING",
                    order_id=order.id,
                    created_at_ist=order_created_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
                    current_time_ist=current_time_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
                    age_minutes=f"{age_minutes:.1f}"
                )
                
                order.status = OrderStatus.PROCESSING
                # Update timestamp in IST (naive datetime)
                order.updated_at = current_time_ist.replace(tzinfo=None)
                updated_count += 1
                
            if updated_count > 0:
                db.commit()
                logger.info(f"Auto-updated {updated_count} orders from PENDING to PROCESSING")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error processing pending orders: {e}")
            if 'db' in locals():
                db.rollback()
                db.close()

    async def update_all_pending_orders_now(self):
        """Immediately update all pending orders to processing (for manual trigger)"""
        try:
            db = next(get_db())
            
            # Get all pending orders older than 5 minutes (exclude cancelled orders)
            cutoff_time_ist = datetime.now(IST) - timedelta(minutes=5)
            cutoff_time_naive = cutoff_time_ist.replace(tzinfo=None)
            pending_orders = db.query(Order).filter(
                Order.status == OrderStatus.PENDING,
                Order.created_at <= cutoff_time_naive
            ).all()
            
            current_time_ist = datetime.now(IST)
            updated_count = 0
            
            for order in pending_orders:
                # Refresh order from DB to get latest status
                db.refresh(order)
                
                # Skip if order is no longer PENDING (might have been cancelled)
                if order.status != OrderStatus.PENDING:
                    continue
                    
                order_created_ist = IST.localize(order.created_at)
                
                logger.info(
                    f"Manually updating order #{order.id} from PENDING to PROCESSING",
                    order_id=order.id,
                    created_at_ist=order_created_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
                    current_time_ist=current_time_ist.strftime("%Y-%m-%d %H:%M:%S IST")
                )
                
                order.status = OrderStatus.PROCESSING
                order.updated_at = current_time_ist.replace(tzinfo=None)
                updated_count += 1
                
            if updated_count > 0:
                db.commit()
                logger.info(f"Manually updated {updated_count} orders from PENDING to PROCESSING")
            else:
                logger.info("No pending orders found to update")
                
            db.close()
            return updated_count
            
        except Exception as e:
            logger.error(f"Error manually updating pending orders: {e}")
            if 'db' in locals():
                db.rollback()
                db.close()
            raise

# Global instance
job_manager = BackgroundJobManager()
