import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { responseMessage } from './response-message';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    const resMsg= responseMessage[`${context.getHandler().name}Failed`];
    return next
      .handle()
      .pipe(
        catchError(err => throwError({
          statusCode,
          resMsg
        }))
      )
  }
}