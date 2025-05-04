/**
 * Type definitions for Cloudflare Workers
 * 
 * This file provides type definitions for Cloudflare Workers runtime and its features
 * such as Durable Objects, RPC, Workflows, etc.
 * 
 * @module worker-types
 */
declare module 'cloudflare:workers' {
    /**
     * Represents an RPC stub that can be used to make remote procedure calls
     */
    export type RpcStub<T extends Rpc.Stubable> = Rpc.Stub<T>;
    
    /**
     * Constructor for creating new RPC stubs
     */
    export const RpcStub: {
        new <T extends Rpc.Stubable>(value: T): Rpc.Stub<T>;
    };
    
    /**
     * Base class for RPC targets
     * 
     * Implements the branded type pattern to ensure type safety for RPC operations
     */
    export abstract class RpcTarget implements Rpc.RpcTargetBranded {
        [Rpc.__RPC_TARGET_BRAND]: never;
    }
    
    /**
     * Base class for Worker entrypoints
     * 
     * This class provides the foundation for creating Workers with various
     * event handlers like fetch, scheduled, queue, etc.
     * 
     * @template Env - The environment variables interface for the Worker
     */
    export abstract class WorkerEntrypoint<Env = unknown> implements Rpc.WorkerEntrypointBranded {
        [Rpc.__WORKER_ENTRYPOINT_BRAND]: never;
        protected ctx: ExecutionContext;
        protected env: Env;
        constructor(ctx: ExecutionContext, env: Env);
        
        /**
         * Handler for HTTP requests
         * @param request - The incoming HTTP request
         * @returns Response or Promise that resolves to a Response
         */
        fetch?(request: Request): Response | Promise<Response>;
        
        /**
         * Handler for tail events
         * @param events - The trace items for the event
         */
        tail?(events: TraceItem[]): void | Promise<void>;
        
        /**
         * Handler for trace events
         * @param traces - The trace items
         */
        trace?(traces: TraceItem[]): void | Promise<void>;
        
        /**
         * Handler for scheduled events
         * @param controller - The scheduled controller
         */
        scheduled?(controller: ScheduledController): void | Promise<void>;
        
        /**
         * Handler for queue events
         * @param batch - The message batch
         */
        queue?(batch: MessageBatch<unknown>): void | Promise<void>;
        
        /**
         * Handler for test events
         * @param controller - The test controller
         */
        test?(controller: TestController): void | Promise<void>;
    }
    
    /**
     * Base class for Durable Objects
     * 
     * This class provides the foundation for creating Durable Objects with various
     * event handlers like fetch, alarm, webSocketMessage, etc.
     * 
     * @template Env - The environment variables interface for the Durable Object
     */
    export abstract class DurableObject<Env = unknown> implements Rpc.DurableObjectBranded {
        [Rpc.__DURABLE_OBJECT_BRAND]: never;
        protected ctx: DurableObjectState;
        protected env: Env;
        constructor(ctx: DurableObjectState, env: Env);
        
        /**
         * Handler for HTTP requests
         * @param request - The incoming HTTP request
         * @returns Response or Promise that resolves to a Response
         */
        fetch?(request: Request): Response | Promise<Response>;
        
        /**
         * Handler for alarm events
         * @param alarmInfo - Information about the alarm invocation
         */
        alarm?(alarmInfo?: AlarmInvocationInfo): void | Promise<void>;
        
        /**
         * Handler for WebSocket messages
         * @param ws - The WebSocket instance
         * @param message - The message received
         */
        webSocketMessage?(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void>;
        
        /**
         * Handler for WebSocket close events
         * @param ws - The WebSocket instance
         * @param code - The close code
         * @param reason - The reason for closure
         * @param wasClean - Whether the closure was clean
         */
        webSocketClose?(ws: WebSocket, code: number, reason: string, wasClean: boolean): void | Promise<void>;
        
        /**
         * Handler for WebSocket error events
         * @param ws - The WebSocket instance
         * @param error - The error encountered
         */
        webSocketError?(ws: WebSocket, error: unknown): void | Promise<void>;
    }
    
    /**
     * Represents a label for workflow duration
     */
    export type WorkflowDurationLabel = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
    
    /**
     * Represents a duration for workflow sleep
     */
    export type WorkflowSleepDuration = `${number} ${WorkflowDurationLabel}${'s' | ''}` | number;
    
    /**
     * Represents a duration for workflow delay
     */
    export type WorkflowDelayDuration = WorkflowSleepDuration;
    
    /**
     * Represents a duration for workflow timeout
     */
    export type WorkflowTimeoutDuration = WorkflowSleepDuration;
    
    /**
     * Represents a backoff strategy for workflows
     */
    export type WorkflowBackoff = 'constant' | 'linear' | 'exponential';
    
    /**
     * Configuration for a workflow step
     */
    export type WorkflowStepConfig = {
        retries?: {
            limit: number;
            delay: WorkflowDelayDuration | number;
            backoff?: WorkflowBackoff;
        };
        timeout?: WorkflowTimeoutDuration | number;
    };
    
    /**
     * Represents an event in a workflow
     * 
     * @template T - The type of the payload
     */
    export type WorkflowEvent<T> = {
        payload: Readonly<T>;
        timestamp: Date;
        instanceId: string;
    };
    
    /**
     * Represents an event in a workflow step
     * 
     * @template T - The type of the payload
     */
    export type WorkflowStepEvent<T> = {
        payload: Readonly<T>;
        timestamp: Date;
        type: string;
    };
    
    /**
     * Base class for workflow steps
     * 
     * Provides methods for performing actions, sleeping, and waiting for events
     */
    export abstract class WorkflowStep {
        /**
         * Perform an action in the workflow step
         * @param name - The name of the action
         * @param callback - The callback function to execute
         * @returns The result of the action
         */
        do<T extends Rpc.Serializable<T>>(name: string, callback: () => Promise<T>): Promise<T>;
        
        /**
         * Perform an action in the workflow step with configuration
         * @param name - The name of the action
         * @param config - The configuration for the action
         * @param callback - The callback function to execute
         * @returns The result of the action
         */
        do<T extends Rpc.Serializable<T>>(name: string, config: WorkflowStepConfig, callback: () => Promise<T>): Promise<T>;
        
        /**
         * Sleep for a specified duration
         * @param name - The name of the sleep action
         * @param duration - The duration to sleep
         */
        sleep: (name: string, duration: WorkflowSleepDuration) => Promise<void>;
        
        /**
         * Sleep until a specified timestamp
         * @param name - The name of the sleep action
         * @param timestamp - The timestamp to sleep until
         */
        sleepUntil: (name: string, timestamp: Date | number) => Promise<void>;
        
        /**
         * Wait for an event in the workflow step
         * @param name - The name of the event
         * @param options - The options for waiting
         * @returns The event that occurred
         */
        waitForEvent<T extends Rpc.Serializable<T>>(name: string, options: {
            type: string;
            timeout?: WorkflowTimeoutDuration | number;
        }): Promise<WorkflowStepEvent<T>>;
    }
    
    /**
     * Base class for workflow entrypoints
     * 
     * Provides the foundation for creating workflows with a run method
     * 
     * @template Env - The environment variables interface for the workflow
     * @template T - The type of the event payload
     */
    export abstract class WorkflowEntrypoint<Env = unknown, T extends Rpc.Serializable<T> | unknown = unknown> implements Rpc.WorkflowEntrypointBranded {
        [Rpc.__WORKFLOW_ENTRYPOINT_BRAND]: never;
        protected ctx: ExecutionContext;
        protected env: Env;
        constructor(ctx: ExecutionContext, env: Env);
        
        /**
         * Run the workflow entrypoint
         * @param event - The workflow event
         * @param step - The workflow step
         * @returns The result of the workflow
         */
        run(event: Readonly<WorkflowEvent<T>>, step: WorkflowStep): Promise<unknown>;
    }
    
    /**
     * Represents the environment variables for Cloudflare Workers
     */
    export const env: Cloudflare.Env;
}