declare module 'cloudflare:workers' {
    export type RpcStub<T extends Rpc.Stubable> = Rpc.Stub<T>;
    export const RpcStub: {
        new <T extends Rpc.Stubable>(value: T): Rpc.Stub<T>;
    };
    export abstract class RpcTarget implements Rpc.RpcTargetBranded {
        [Rpc.__RPC_TARGET_BRAND]: never;
    }
    // `protected` fields don't appear in `keyof`s, so can't be accessed over RPC
    export abstract class WorkerEntrypoint<Env = unknown> implements Rpc.WorkerEntrypointBranded {
        [Rpc.__WORKER_ENTRYPOINT_BRAND]: never;
        protected ctx: ExecutionContext;
        protected env: Env;
        constructor(ctx: ExecutionContext, env: Env);
        fetch?(request: Request): Response | Promise<Response>;
        tail?(events: TraceItem[]): void | Promise<void>;
        trace?(traces: TraceItem[]): void | Promise<void>;
        scheduled?(controller: ScheduledController): void | Promise<void>;
        queue?(batch: MessageBatch<unknown>): void | Promise<void>;
        test?(controller: TestController): void | Promise<void>;
    }
    export abstract class DurableObject<Env = unknown> implements Rpc.DurableObjectBranded {
        [Rpc.__DURABLE_OBJECT_BRAND]: never;
        protected ctx: DurableObjectState;
        protected env: Env;
        constructor(ctx: DurableObjectState, env: Env);
        fetch?(request: Request): Response | Promise<Response>;
        alarm?(alarmInfo?: AlarmInvocationInfo): void | Promise<void>;
        webSocketMessage?(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void>;
        webSocketClose?(ws: WebSocket, code: number, reason: string, wasClean: boolean): void | Promise<void>;
        webSocketError?(ws: WebSocket, error: unknown): void | Promise<void>;
    }
    export type WorkflowDurationLabel = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
    export type WorkflowSleepDuration = `${number} ${WorkflowDurationLabel}${'s' | ''}` | number;
    export type WorkflowDelayDuration = WorkflowSleepDuration;
    export type WorkflowTimeoutDuration = WorkflowSleepDuration;
    export type WorkflowBackoff = 'constant' | 'linear' | 'exponential';
    export type WorkflowStepConfig = {
        retries?: {
            limit: number;
            delay: WorkflowDelayDuration | number;
            backoff?: WorkflowBackoff;
        };
        timeout?: WorkflowTimeoutDuration | number;
    };
    export type WorkflowEvent<T> = {
        payload: Readonly<T>;
        timestamp: Date;
        instanceId: string;
    };
    export type WorkflowStepEvent<T> = {
        payload: Readonly<T>;
        timestamp: Date;
        type: string;
    };
    export abstract class WorkflowStep {
        do<T extends Rpc.Serializable<T>>(name: string, callback: () => Promise<T>): Promise<T>;
        do<T extends Rpc.Serializable<T>>(name: string, config: WorkflowStepConfig, callback: () => Promise<T>): Promise<T>;
        sleep: (name: string, duration: WorkflowSleepDuration) => Promise<void>;
        sleepUntil: (name: string, timestamp: Date | number) => Promise<void>;
        waitForEvent<T extends Rpc.Serializable<T>>(name: string, options: {
            type: string;
            timeout?: WorkflowTimeoutDuration | number;
        }): Promise<WorkflowStepEvent<T>>;
    }
    export abstract class WorkflowEntrypoint<Env = unknown, T extends Rpc.Serializable<T> | unknown = unknown> implements Rpc.WorkflowEntrypointBranded {
        [Rpc.__WORKFLOW_ENTRYPOINT_BRAND]: never;
        protected ctx: ExecutionContext;
        protected env: Env;
        constructor(ctx: ExecutionContext, env: Env);
        run(event: Readonly<WorkflowEvent<T>>, step: WorkflowStep): Promise<unknown>;
    }
    export const env: Cloudflare.Env;
}