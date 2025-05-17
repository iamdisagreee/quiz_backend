from taskiq_nats import NATSKeyValueScheduleSource

from backend.broker import scheduler_storage


async def get_scheduler_storage() -> NATSKeyValueScheduleSource:
    return scheduler_storage