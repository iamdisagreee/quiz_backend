from backend.dependecies.redis_depends import get_redis
from backend.services.broker import worker


@worker.task(task_name='schedule_remove_auth_code')
async def schedule_remove_auth_code(email: str):
    """
    Удаление кода подтверждения спустя 1 минуту
    :param email: почта
    """
    redis_session = await get_redis()
    await redis_session.delete(email)

