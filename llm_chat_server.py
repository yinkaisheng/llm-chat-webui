import os
import sys
from datetime import datetime

import sys_util as sutil
import fastapi_util as futil
from log_util import logger, config_logger, log, Fore


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('-H', '--host', type=str, default='0.0.0.0', help='host[0.0.0.0]')
    parser.add_argument('-p', '--port', type=int, default=9949, help='port[9949]')
    parser.add_argument('-l', '--log-level', type=str, default='info', help='log level[info]')

    args = parser.parse_args()

    os.chdir(sutil.ExeDir)

    import uvicorn
    from app import app

    log_dir = './logs'
    config_logger(logger, log_level=args.log_level, log_dir=log_dir, log_file=f'{sutil.ExeNameNoExt}.log',
                  backup_count=7)
    logger.info(f'pid {os.getpid()} command: {sutil.PythonExePath} {sys.argv} \nstarts server, config=\n{args}')
    with open('serverinfo.py', 'wt', encoding='utf-8') as fout:
        fout.write(f'StartTime = "{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}"\n')
    futil.setup_log_router(app, log_dir)
    futil.setup_file_server_router(app, '/chat', './static') # 前端代码放在这个目录

    uvicorn.run(app, host=args.host, port=args.port,
                log_config=futil.get_uvicorn_logging_config())
