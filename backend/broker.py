from taskiq import TaskiqScheduler
from taskiq_nats import PullBasedJetStreamBroker, NATSObjectStoreResultBackend, NATSKeyValueScheduleSource

from backend.config import load_config

config = load_config()

worker = PullBasedJetStreamBroker(
    servers=config.site.nats,
    queue='taskiq_queue').with_result_backend(
    result_backend=NATSObjectStoreResultBackend(servers=config.site.nats)
)

scheduler_storage = NATSKeyValueScheduleSource(servers=config.site.nats)
scheduler = TaskiqScheduler(worker, sources=[scheduler_storage])