"""
Timezone utilities for consistent IST handling across the application
"""

from datetime import datetime, timezone
import pytz

# IST timezone
IST = pytz.timezone('Asia/Kolkata')

def get_ist_now() -> datetime:
    """Get current datetime in IST"""
    return datetime.now(IST)

def to_ist(dt: datetime) -> datetime:
    """Convert datetime to IST"""
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)

def ist_to_utc(dt: datetime) -> datetime:
    """Convert IST datetime to UTC"""
    if dt.tzinfo is None:
        # Assume IST if no timezone info
        dt = IST.localize(dt)
    return dt.astimezone(timezone.utc)

def format_ist_datetime(dt: datetime) -> str:
    """Format datetime in IST for display"""
    ist_dt = to_ist(dt)
    return ist_dt.strftime('%Y-%m-%d %H:%M:%S IST')
