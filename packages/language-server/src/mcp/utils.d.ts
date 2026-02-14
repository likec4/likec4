import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { z, ZodRawShape, ZodTypeAny } from 'zod/v3';
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LikeC4LanguageServices } from '../LikeC4LanguageServices';
export declare const logger: any;
type ToolResult<Out extends undefined | ZodRawShape = undefined> = Out extends ZodRawShape ? z.objectOutputType<Out, ZodTypeAny> : string;
type LikeC4ToolCallback<Args extends undefined | ZodRawShape, Out extends undefined | ZodRawShape> = Args extends ZodRawShape ? (languageServices: LikeC4LanguageServices, args: z.objectOutputType<Args, ZodTypeAny>, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => Promise<ToolResult<Out>> : (languageServices: LikeC4LanguageServices, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => Promise<ToolResult<Out>>;
export declare function likec4Tool<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape, Cb extends LikeC4ToolCallback<InputArgs, OutputArgs>>(config: {
    name: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema?: OutputArgs;
    annotations?: ToolAnnotations;
}, cb: Cb): (languageServices: LikeC4LanguageServices) => [string, {
    inputSchema?: InputArgs;
}, ToolCallback<InputArgs>];
export {};
