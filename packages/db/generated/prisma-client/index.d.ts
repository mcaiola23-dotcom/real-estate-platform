
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Tenant
 * 
 */
export type Tenant = $Result.DefaultSelection<Prisma.$TenantPayload>
/**
 * Model TenantDomain
 * 
 */
export type TenantDomain = $Result.DefaultSelection<Prisma.$TenantDomainPayload>
/**
 * Model WebsiteConfig
 * 
 */
export type WebsiteConfig = $Result.DefaultSelection<Prisma.$WebsiteConfigPayload>
/**
 * Model TenantControlSettings
 * 
 */
export type TenantControlSettings = $Result.DefaultSelection<Prisma.$TenantControlSettingsPayload>
/**
 * Model TenantControlActor
 * 
 */
export type TenantControlActor = $Result.DefaultSelection<Prisma.$TenantControlActorPayload>
/**
 * Model ModuleConfig
 * 
 */
export type ModuleConfig = $Result.DefaultSelection<Prisma.$ModuleConfigPayload>
/**
 * Model Contact
 * 
 */
export type Contact = $Result.DefaultSelection<Prisma.$ContactPayload>
/**
 * Model Lead
 * 
 */
export type Lead = $Result.DefaultSelection<Prisma.$LeadPayload>
/**
 * Model Activity
 * 
 */
export type Activity = $Result.DefaultSelection<Prisma.$ActivityPayload>
/**
 * Model IngestedEvent
 * 
 */
export type IngestedEvent = $Result.DefaultSelection<Prisma.$IngestedEventPayload>
/**
 * Model IngestionQueueJob
 * 
 */
export type IngestionQueueJob = $Result.DefaultSelection<Prisma.$IngestionQueueJobPayload>
/**
 * Model AdminAuditEvent
 * 
 */
export type AdminAuditEvent = $Result.DefaultSelection<Prisma.$AdminAuditEventPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Tenants
 * const tenants = await prisma.tenant.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Tenants
   * const tenants = await prisma.tenant.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.tenant`: Exposes CRUD operations for the **Tenant** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenants
    * const tenants = await prisma.tenant.findMany()
    * ```
    */
  get tenant(): Prisma.TenantDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenantDomain`: Exposes CRUD operations for the **TenantDomain** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TenantDomains
    * const tenantDomains = await prisma.tenantDomain.findMany()
    * ```
    */
  get tenantDomain(): Prisma.TenantDomainDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.websiteConfig`: Exposes CRUD operations for the **WebsiteConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WebsiteConfigs
    * const websiteConfigs = await prisma.websiteConfig.findMany()
    * ```
    */
  get websiteConfig(): Prisma.WebsiteConfigDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenantControlSettings`: Exposes CRUD operations for the **TenantControlSettings** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TenantControlSettings
    * const tenantControlSettings = await prisma.tenantControlSettings.findMany()
    * ```
    */
  get tenantControlSettings(): Prisma.TenantControlSettingsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenantControlActor`: Exposes CRUD operations for the **TenantControlActor** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TenantControlActors
    * const tenantControlActors = await prisma.tenantControlActor.findMany()
    * ```
    */
  get tenantControlActor(): Prisma.TenantControlActorDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.moduleConfig`: Exposes CRUD operations for the **ModuleConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModuleConfigs
    * const moduleConfigs = await prisma.moduleConfig.findMany()
    * ```
    */
  get moduleConfig(): Prisma.ModuleConfigDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.contact`: Exposes CRUD operations for the **Contact** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Contacts
    * const contacts = await prisma.contact.findMany()
    * ```
    */
  get contact(): Prisma.ContactDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.lead`: Exposes CRUD operations for the **Lead** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Leads
    * const leads = await prisma.lead.findMany()
    * ```
    */
  get lead(): Prisma.LeadDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.activity`: Exposes CRUD operations for the **Activity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Activities
    * const activities = await prisma.activity.findMany()
    * ```
    */
  get activity(): Prisma.ActivityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.ingestedEvent`: Exposes CRUD operations for the **IngestedEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IngestedEvents
    * const ingestedEvents = await prisma.ingestedEvent.findMany()
    * ```
    */
  get ingestedEvent(): Prisma.IngestedEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.ingestionQueueJob`: Exposes CRUD operations for the **IngestionQueueJob** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IngestionQueueJobs
    * const ingestionQueueJobs = await prisma.ingestionQueueJob.findMany()
    * ```
    */
  get ingestionQueueJob(): Prisma.IngestionQueueJobDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.adminAuditEvent`: Exposes CRUD operations for the **AdminAuditEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AdminAuditEvents
    * const adminAuditEvents = await prisma.adminAuditEvent.findMany()
    * ```
    */
  get adminAuditEvent(): Prisma.AdminAuditEventDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.2
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Tenant: 'Tenant',
    TenantDomain: 'TenantDomain',
    WebsiteConfig: 'WebsiteConfig',
    TenantControlSettings: 'TenantControlSettings',
    TenantControlActor: 'TenantControlActor',
    ModuleConfig: 'ModuleConfig',
    Contact: 'Contact',
    Lead: 'Lead',
    Activity: 'Activity',
    IngestedEvent: 'IngestedEvent',
    IngestionQueueJob: 'IngestionQueueJob',
    AdminAuditEvent: 'AdminAuditEvent'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "tenant" | "tenantDomain" | "websiteConfig" | "tenantControlSettings" | "tenantControlActor" | "moduleConfig" | "contact" | "lead" | "activity" | "ingestedEvent" | "ingestionQueueJob" | "adminAuditEvent"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Tenant: {
        payload: Prisma.$TenantPayload<ExtArgs>
        fields: Prisma.TenantFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TenantFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TenantFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>
          }
          findFirst: {
            args: Prisma.TenantFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TenantFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>
          }
          findMany: {
            args: Prisma.TenantFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>[]
          }
          create: {
            args: Prisma.TenantCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>
          }
          createMany: {
            args: Prisma.TenantCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TenantCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>[]
          }
          delete: {
            args: Prisma.TenantDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>
          }
          update: {
            args: Prisma.TenantUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>
          }
          deleteMany: {
            args: Prisma.TenantDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TenantUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TenantUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>[]
          }
          upsert: {
            args: Prisma.TenantUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantPayload>
          }
          aggregate: {
            args: Prisma.TenantAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenant>
          }
          groupBy: {
            args: Prisma.TenantGroupByArgs<ExtArgs>
            result: $Utils.Optional<TenantGroupByOutputType>[]
          }
          count: {
            args: Prisma.TenantCountArgs<ExtArgs>
            result: $Utils.Optional<TenantCountAggregateOutputType> | number
          }
        }
      }
      TenantDomain: {
        payload: Prisma.$TenantDomainPayload<ExtArgs>
        fields: Prisma.TenantDomainFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TenantDomainFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TenantDomainFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>
          }
          findFirst: {
            args: Prisma.TenantDomainFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TenantDomainFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>
          }
          findMany: {
            args: Prisma.TenantDomainFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>[]
          }
          create: {
            args: Prisma.TenantDomainCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>
          }
          createMany: {
            args: Prisma.TenantDomainCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TenantDomainCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>[]
          }
          delete: {
            args: Prisma.TenantDomainDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>
          }
          update: {
            args: Prisma.TenantDomainUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>
          }
          deleteMany: {
            args: Prisma.TenantDomainDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TenantDomainUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TenantDomainUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>[]
          }
          upsert: {
            args: Prisma.TenantDomainUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantDomainPayload>
          }
          aggregate: {
            args: Prisma.TenantDomainAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenantDomain>
          }
          groupBy: {
            args: Prisma.TenantDomainGroupByArgs<ExtArgs>
            result: $Utils.Optional<TenantDomainGroupByOutputType>[]
          }
          count: {
            args: Prisma.TenantDomainCountArgs<ExtArgs>
            result: $Utils.Optional<TenantDomainCountAggregateOutputType> | number
          }
        }
      }
      WebsiteConfig: {
        payload: Prisma.$WebsiteConfigPayload<ExtArgs>
        fields: Prisma.WebsiteConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebsiteConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebsiteConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>
          }
          findFirst: {
            args: Prisma.WebsiteConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebsiteConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>
          }
          findMany: {
            args: Prisma.WebsiteConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>[]
          }
          create: {
            args: Prisma.WebsiteConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>
          }
          createMany: {
            args: Prisma.WebsiteConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebsiteConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>[]
          }
          delete: {
            args: Prisma.WebsiteConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>
          }
          update: {
            args: Prisma.WebsiteConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>
          }
          deleteMany: {
            args: Prisma.WebsiteConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebsiteConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WebsiteConfigUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>[]
          }
          upsert: {
            args: Prisma.WebsiteConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebsiteConfigPayload>
          }
          aggregate: {
            args: Prisma.WebsiteConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebsiteConfig>
          }
          groupBy: {
            args: Prisma.WebsiteConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebsiteConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebsiteConfigCountArgs<ExtArgs>
            result: $Utils.Optional<WebsiteConfigCountAggregateOutputType> | number
          }
        }
      }
      TenantControlSettings: {
        payload: Prisma.$TenantControlSettingsPayload<ExtArgs>
        fields: Prisma.TenantControlSettingsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TenantControlSettingsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TenantControlSettingsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>
          }
          findFirst: {
            args: Prisma.TenantControlSettingsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TenantControlSettingsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>
          }
          findMany: {
            args: Prisma.TenantControlSettingsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>[]
          }
          create: {
            args: Prisma.TenantControlSettingsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>
          }
          createMany: {
            args: Prisma.TenantControlSettingsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TenantControlSettingsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>[]
          }
          delete: {
            args: Prisma.TenantControlSettingsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>
          }
          update: {
            args: Prisma.TenantControlSettingsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>
          }
          deleteMany: {
            args: Prisma.TenantControlSettingsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TenantControlSettingsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TenantControlSettingsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>[]
          }
          upsert: {
            args: Prisma.TenantControlSettingsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlSettingsPayload>
          }
          aggregate: {
            args: Prisma.TenantControlSettingsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenantControlSettings>
          }
          groupBy: {
            args: Prisma.TenantControlSettingsGroupByArgs<ExtArgs>
            result: $Utils.Optional<TenantControlSettingsGroupByOutputType>[]
          }
          count: {
            args: Prisma.TenantControlSettingsCountArgs<ExtArgs>
            result: $Utils.Optional<TenantControlSettingsCountAggregateOutputType> | number
          }
        }
      }
      TenantControlActor: {
        payload: Prisma.$TenantControlActorPayload<ExtArgs>
        fields: Prisma.TenantControlActorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TenantControlActorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TenantControlActorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>
          }
          findFirst: {
            args: Prisma.TenantControlActorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TenantControlActorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>
          }
          findMany: {
            args: Prisma.TenantControlActorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>[]
          }
          create: {
            args: Prisma.TenantControlActorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>
          }
          createMany: {
            args: Prisma.TenantControlActorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TenantControlActorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>[]
          }
          delete: {
            args: Prisma.TenantControlActorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>
          }
          update: {
            args: Prisma.TenantControlActorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>
          }
          deleteMany: {
            args: Prisma.TenantControlActorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TenantControlActorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TenantControlActorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>[]
          }
          upsert: {
            args: Prisma.TenantControlActorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TenantControlActorPayload>
          }
          aggregate: {
            args: Prisma.TenantControlActorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenantControlActor>
          }
          groupBy: {
            args: Prisma.TenantControlActorGroupByArgs<ExtArgs>
            result: $Utils.Optional<TenantControlActorGroupByOutputType>[]
          }
          count: {
            args: Prisma.TenantControlActorCountArgs<ExtArgs>
            result: $Utils.Optional<TenantControlActorCountAggregateOutputType> | number
          }
        }
      }
      ModuleConfig: {
        payload: Prisma.$ModuleConfigPayload<ExtArgs>
        fields: Prisma.ModuleConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModuleConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModuleConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>
          }
          findFirst: {
            args: Prisma.ModuleConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModuleConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>
          }
          findMany: {
            args: Prisma.ModuleConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>[]
          }
          create: {
            args: Prisma.ModuleConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>
          }
          createMany: {
            args: Prisma.ModuleConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModuleConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>[]
          }
          delete: {
            args: Prisma.ModuleConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>
          }
          update: {
            args: Prisma.ModuleConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>
          }
          deleteMany: {
            args: Prisma.ModuleConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModuleConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModuleConfigUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>[]
          }
          upsert: {
            args: Prisma.ModuleConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModuleConfigPayload>
          }
          aggregate: {
            args: Prisma.ModuleConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModuleConfig>
          }
          groupBy: {
            args: Prisma.ModuleConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModuleConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModuleConfigCountArgs<ExtArgs>
            result: $Utils.Optional<ModuleConfigCountAggregateOutputType> | number
          }
        }
      }
      Contact: {
        payload: Prisma.$ContactPayload<ExtArgs>
        fields: Prisma.ContactFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContactFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContactFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          findFirst: {
            args: Prisma.ContactFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContactFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          findMany: {
            args: Prisma.ContactFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          create: {
            args: Prisma.ContactCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          createMany: {
            args: Prisma.ContactCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContactCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          delete: {
            args: Prisma.ContactDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          update: {
            args: Prisma.ContactUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          deleteMany: {
            args: Prisma.ContactDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContactUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContactUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          upsert: {
            args: Prisma.ContactUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          aggregate: {
            args: Prisma.ContactAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContact>
          }
          groupBy: {
            args: Prisma.ContactGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContactGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContactCountArgs<ExtArgs>
            result: $Utils.Optional<ContactCountAggregateOutputType> | number
          }
        }
      }
      Lead: {
        payload: Prisma.$LeadPayload<ExtArgs>
        fields: Prisma.LeadFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LeadFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LeadFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>
          }
          findFirst: {
            args: Prisma.LeadFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LeadFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>
          }
          findMany: {
            args: Prisma.LeadFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>[]
          }
          create: {
            args: Prisma.LeadCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>
          }
          createMany: {
            args: Prisma.LeadCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LeadCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>[]
          }
          delete: {
            args: Prisma.LeadDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>
          }
          update: {
            args: Prisma.LeadUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>
          }
          deleteMany: {
            args: Prisma.LeadDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LeadUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LeadUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>[]
          }
          upsert: {
            args: Prisma.LeadUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeadPayload>
          }
          aggregate: {
            args: Prisma.LeadAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLead>
          }
          groupBy: {
            args: Prisma.LeadGroupByArgs<ExtArgs>
            result: $Utils.Optional<LeadGroupByOutputType>[]
          }
          count: {
            args: Prisma.LeadCountArgs<ExtArgs>
            result: $Utils.Optional<LeadCountAggregateOutputType> | number
          }
        }
      }
      Activity: {
        payload: Prisma.$ActivityPayload<ExtArgs>
        fields: Prisma.ActivityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ActivityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ActivityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          findFirst: {
            args: Prisma.ActivityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ActivityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          findMany: {
            args: Prisma.ActivityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>[]
          }
          create: {
            args: Prisma.ActivityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          createMany: {
            args: Prisma.ActivityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ActivityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>[]
          }
          delete: {
            args: Prisma.ActivityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          update: {
            args: Prisma.ActivityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          deleteMany: {
            args: Prisma.ActivityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ActivityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ActivityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>[]
          }
          upsert: {
            args: Prisma.ActivityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          aggregate: {
            args: Prisma.ActivityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateActivity>
          }
          groupBy: {
            args: Prisma.ActivityGroupByArgs<ExtArgs>
            result: $Utils.Optional<ActivityGroupByOutputType>[]
          }
          count: {
            args: Prisma.ActivityCountArgs<ExtArgs>
            result: $Utils.Optional<ActivityCountAggregateOutputType> | number
          }
        }
      }
      IngestedEvent: {
        payload: Prisma.$IngestedEventPayload<ExtArgs>
        fields: Prisma.IngestedEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IngestedEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IngestedEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>
          }
          findFirst: {
            args: Prisma.IngestedEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IngestedEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>
          }
          findMany: {
            args: Prisma.IngestedEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>[]
          }
          create: {
            args: Prisma.IngestedEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>
          }
          createMany: {
            args: Prisma.IngestedEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IngestedEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>[]
          }
          delete: {
            args: Prisma.IngestedEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>
          }
          update: {
            args: Prisma.IngestedEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>
          }
          deleteMany: {
            args: Prisma.IngestedEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IngestedEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IngestedEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>[]
          }
          upsert: {
            args: Prisma.IngestedEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestedEventPayload>
          }
          aggregate: {
            args: Prisma.IngestedEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIngestedEvent>
          }
          groupBy: {
            args: Prisma.IngestedEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<IngestedEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.IngestedEventCountArgs<ExtArgs>
            result: $Utils.Optional<IngestedEventCountAggregateOutputType> | number
          }
        }
      }
      IngestionQueueJob: {
        payload: Prisma.$IngestionQueueJobPayload<ExtArgs>
        fields: Prisma.IngestionQueueJobFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IngestionQueueJobFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IngestionQueueJobFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>
          }
          findFirst: {
            args: Prisma.IngestionQueueJobFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IngestionQueueJobFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>
          }
          findMany: {
            args: Prisma.IngestionQueueJobFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>[]
          }
          create: {
            args: Prisma.IngestionQueueJobCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>
          }
          createMany: {
            args: Prisma.IngestionQueueJobCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IngestionQueueJobCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>[]
          }
          delete: {
            args: Prisma.IngestionQueueJobDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>
          }
          update: {
            args: Prisma.IngestionQueueJobUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>
          }
          deleteMany: {
            args: Prisma.IngestionQueueJobDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IngestionQueueJobUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IngestionQueueJobUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>[]
          }
          upsert: {
            args: Prisma.IngestionQueueJobUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IngestionQueueJobPayload>
          }
          aggregate: {
            args: Prisma.IngestionQueueJobAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIngestionQueueJob>
          }
          groupBy: {
            args: Prisma.IngestionQueueJobGroupByArgs<ExtArgs>
            result: $Utils.Optional<IngestionQueueJobGroupByOutputType>[]
          }
          count: {
            args: Prisma.IngestionQueueJobCountArgs<ExtArgs>
            result: $Utils.Optional<IngestionQueueJobCountAggregateOutputType> | number
          }
        }
      }
      AdminAuditEvent: {
        payload: Prisma.$AdminAuditEventPayload<ExtArgs>
        fields: Prisma.AdminAuditEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AdminAuditEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AdminAuditEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>
          }
          findFirst: {
            args: Prisma.AdminAuditEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AdminAuditEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>
          }
          findMany: {
            args: Prisma.AdminAuditEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>[]
          }
          create: {
            args: Prisma.AdminAuditEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>
          }
          createMany: {
            args: Prisma.AdminAuditEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AdminAuditEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>[]
          }
          delete: {
            args: Prisma.AdminAuditEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>
          }
          update: {
            args: Prisma.AdminAuditEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>
          }
          deleteMany: {
            args: Prisma.AdminAuditEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AdminAuditEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AdminAuditEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>[]
          }
          upsert: {
            args: Prisma.AdminAuditEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminAuditEventPayload>
          }
          aggregate: {
            args: Prisma.AdminAuditEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAdminAuditEvent>
          }
          groupBy: {
            args: Prisma.AdminAuditEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<AdminAuditEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.AdminAuditEventCountArgs<ExtArgs>
            result: $Utils.Optional<AdminAuditEventCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    tenant?: TenantOmit
    tenantDomain?: TenantDomainOmit
    websiteConfig?: WebsiteConfigOmit
    tenantControlSettings?: TenantControlSettingsOmit
    tenantControlActor?: TenantControlActorOmit
    moduleConfig?: ModuleConfigOmit
    contact?: ContactOmit
    lead?: LeadOmit
    activity?: ActivityOmit
    ingestedEvent?: IngestedEventOmit
    ingestionQueueJob?: IngestionQueueJobOmit
    adminAuditEvent?: AdminAuditEventOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TenantCountOutputType
   */

  export type TenantCountOutputType = {
    domains: number
    controlActors: number
    contacts: number
    leads: number
    activities: number
    ingestedEvents: number
    ingestionQueueJobs: number
  }

  export type TenantCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    domains?: boolean | TenantCountOutputTypeCountDomainsArgs
    controlActors?: boolean | TenantCountOutputTypeCountControlActorsArgs
    contacts?: boolean | TenantCountOutputTypeCountContactsArgs
    leads?: boolean | TenantCountOutputTypeCountLeadsArgs
    activities?: boolean | TenantCountOutputTypeCountActivitiesArgs
    ingestedEvents?: boolean | TenantCountOutputTypeCountIngestedEventsArgs
    ingestionQueueJobs?: boolean | TenantCountOutputTypeCountIngestionQueueJobsArgs
  }

  // Custom InputTypes
  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantCountOutputType
     */
    select?: TenantCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountDomainsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TenantDomainWhereInput
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountControlActorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TenantControlActorWhereInput
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountContactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactWhereInput
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountLeadsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeadWhereInput
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountActivitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityWhereInput
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountIngestedEventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IngestedEventWhereInput
  }

  /**
   * TenantCountOutputType without action
   */
  export type TenantCountOutputTypeCountIngestionQueueJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IngestionQueueJobWhereInput
  }


  /**
   * Count Type WebsiteConfigCountOutputType
   */

  export type WebsiteConfigCountOutputType = {
    modules: number
  }

  export type WebsiteConfigCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    modules?: boolean | WebsiteConfigCountOutputTypeCountModulesArgs
  }

  // Custom InputTypes
  /**
   * WebsiteConfigCountOutputType without action
   */
  export type WebsiteConfigCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfigCountOutputType
     */
    select?: WebsiteConfigCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WebsiteConfigCountOutputType without action
   */
  export type WebsiteConfigCountOutputTypeCountModulesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModuleConfigWhereInput
  }


  /**
   * Count Type ContactCountOutputType
   */

  export type ContactCountOutputType = {
    leads: number
    activities: number
  }

  export type ContactCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    leads?: boolean | ContactCountOutputTypeCountLeadsArgs
    activities?: boolean | ContactCountOutputTypeCountActivitiesArgs
  }

  // Custom InputTypes
  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactCountOutputType
     */
    select?: ContactCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountLeadsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeadWhereInput
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountActivitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityWhereInput
  }


  /**
   * Count Type LeadCountOutputType
   */

  export type LeadCountOutputType = {
    activities: number
  }

  export type LeadCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    activities?: boolean | LeadCountOutputTypeCountActivitiesArgs
  }

  // Custom InputTypes
  /**
   * LeadCountOutputType without action
   */
  export type LeadCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeadCountOutputType
     */
    select?: LeadCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LeadCountOutputType without action
   */
  export type LeadCountOutputTypeCountActivitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Tenant
   */

  export type AggregateTenant = {
    _count: TenantCountAggregateOutputType | null
    _min: TenantMinAggregateOutputType | null
    _max: TenantMaxAggregateOutputType | null
  }

  export type TenantMinAggregateOutputType = {
    id: string | null
    slug: string | null
    name: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantMaxAggregateOutputType = {
    id: string | null
    slug: string | null
    name: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantCountAggregateOutputType = {
    id: number
    slug: number
    name: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TenantMinAggregateInputType = {
    id?: true
    slug?: true
    name?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantMaxAggregateInputType = {
    id?: true
    slug?: true
    name?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantCountAggregateInputType = {
    id?: true
    slug?: true
    name?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TenantAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tenant to aggregate.
     */
    where?: TenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tenants to fetch.
     */
    orderBy?: TenantOrderByWithRelationInput | TenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tenants
    **/
    _count?: true | TenantCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TenantMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TenantMaxAggregateInputType
  }

  export type GetTenantAggregateType<T extends TenantAggregateArgs> = {
        [P in keyof T & keyof AggregateTenant]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenant[P]>
      : GetScalarType<T[P], AggregateTenant[P]>
  }




  export type TenantGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TenantWhereInput
    orderBy?: TenantOrderByWithAggregationInput | TenantOrderByWithAggregationInput[]
    by: TenantScalarFieldEnum[] | TenantScalarFieldEnum
    having?: TenantScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TenantCountAggregateInputType | true
    _min?: TenantMinAggregateInputType
    _max?: TenantMaxAggregateInputType
  }

  export type TenantGroupByOutputType = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date
    updatedAt: Date
    _count: TenantCountAggregateOutputType | null
    _min: TenantMinAggregateOutputType | null
    _max: TenantMaxAggregateOutputType | null
  }

  type GetTenantGroupByPayload<T extends TenantGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TenantGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TenantGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TenantGroupByOutputType[P]>
            : GetScalarType<T[P], TenantGroupByOutputType[P]>
        }
      >
    >


  export type TenantSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    name?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    domains?: boolean | Tenant$domainsArgs<ExtArgs>
    websiteConfig?: boolean | Tenant$websiteConfigArgs<ExtArgs>
    controlSettings?: boolean | Tenant$controlSettingsArgs<ExtArgs>
    controlActors?: boolean | Tenant$controlActorsArgs<ExtArgs>
    contacts?: boolean | Tenant$contactsArgs<ExtArgs>
    leads?: boolean | Tenant$leadsArgs<ExtArgs>
    activities?: boolean | Tenant$activitiesArgs<ExtArgs>
    ingestedEvents?: boolean | Tenant$ingestedEventsArgs<ExtArgs>
    ingestionQueueJobs?: boolean | Tenant$ingestionQueueJobsArgs<ExtArgs>
    _count?: boolean | TenantCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant"]>

  export type TenantSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    name?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tenant"]>

  export type TenantSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    name?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tenant"]>

  export type TenantSelectScalar = {
    id?: boolean
    slug?: boolean
    name?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TenantOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "slug" | "name" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["tenant"]>
  export type TenantInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    domains?: boolean | Tenant$domainsArgs<ExtArgs>
    websiteConfig?: boolean | Tenant$websiteConfigArgs<ExtArgs>
    controlSettings?: boolean | Tenant$controlSettingsArgs<ExtArgs>
    controlActors?: boolean | Tenant$controlActorsArgs<ExtArgs>
    contacts?: boolean | Tenant$contactsArgs<ExtArgs>
    leads?: boolean | Tenant$leadsArgs<ExtArgs>
    activities?: boolean | Tenant$activitiesArgs<ExtArgs>
    ingestedEvents?: boolean | Tenant$ingestedEventsArgs<ExtArgs>
    ingestionQueueJobs?: boolean | Tenant$ingestionQueueJobsArgs<ExtArgs>
    _count?: boolean | TenantCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TenantIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type TenantIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $TenantPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Tenant"
    objects: {
      domains: Prisma.$TenantDomainPayload<ExtArgs>[]
      websiteConfig: Prisma.$WebsiteConfigPayload<ExtArgs> | null
      controlSettings: Prisma.$TenantControlSettingsPayload<ExtArgs> | null
      controlActors: Prisma.$TenantControlActorPayload<ExtArgs>[]
      contacts: Prisma.$ContactPayload<ExtArgs>[]
      leads: Prisma.$LeadPayload<ExtArgs>[]
      activities: Prisma.$ActivityPayload<ExtArgs>[]
      ingestedEvents: Prisma.$IngestedEventPayload<ExtArgs>[]
      ingestionQueueJobs: Prisma.$IngestionQueueJobPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      slug: string
      name: string
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["tenant"]>
    composites: {}
  }

  type TenantGetPayload<S extends boolean | null | undefined | TenantDefaultArgs> = $Result.GetResult<Prisma.$TenantPayload, S>

  type TenantCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TenantFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TenantCountAggregateInputType | true
    }

  export interface TenantDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Tenant'], meta: { name: 'Tenant' } }
    /**
     * Find zero or one Tenant that matches the filter.
     * @param {TenantFindUniqueArgs} args - Arguments to find a Tenant
     * @example
     * // Get one Tenant
     * const tenant = await prisma.tenant.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TenantFindUniqueArgs>(args: SelectSubset<T, TenantFindUniqueArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenant that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TenantFindUniqueOrThrowArgs} args - Arguments to find a Tenant
     * @example
     * // Get one Tenant
     * const tenant = await prisma.tenant.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TenantFindUniqueOrThrowArgs>(args: SelectSubset<T, TenantFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantFindFirstArgs} args - Arguments to find a Tenant
     * @example
     * // Get one Tenant
     * const tenant = await prisma.tenant.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TenantFindFirstArgs>(args?: SelectSubset<T, TenantFindFirstArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantFindFirstOrThrowArgs} args - Arguments to find a Tenant
     * @example
     * // Get one Tenant
     * const tenant = await prisma.tenant.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TenantFindFirstOrThrowArgs>(args?: SelectSubset<T, TenantFindFirstOrThrowArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenants
     * const tenants = await prisma.tenant.findMany()
     * 
     * // Get first 10 Tenants
     * const tenants = await prisma.tenant.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenantWithIdOnly = await prisma.tenant.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TenantFindManyArgs>(args?: SelectSubset<T, TenantFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenant.
     * @param {TenantCreateArgs} args - Arguments to create a Tenant.
     * @example
     * // Create one Tenant
     * const Tenant = await prisma.tenant.create({
     *   data: {
     *     // ... data to create a Tenant
     *   }
     * })
     * 
     */
    create<T extends TenantCreateArgs>(args: SelectSubset<T, TenantCreateArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenants.
     * @param {TenantCreateManyArgs} args - Arguments to create many Tenants.
     * @example
     * // Create many Tenants
     * const tenant = await prisma.tenant.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TenantCreateManyArgs>(args?: SelectSubset<T, TenantCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenants and returns the data saved in the database.
     * @param {TenantCreateManyAndReturnArgs} args - Arguments to create many Tenants.
     * @example
     * // Create many Tenants
     * const tenant = await prisma.tenant.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenants and only return the `id`
     * const tenantWithIdOnly = await prisma.tenant.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TenantCreateManyAndReturnArgs>(args?: SelectSubset<T, TenantCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenant.
     * @param {TenantDeleteArgs} args - Arguments to delete one Tenant.
     * @example
     * // Delete one Tenant
     * const Tenant = await prisma.tenant.delete({
     *   where: {
     *     // ... filter to delete one Tenant
     *   }
     * })
     * 
     */
    delete<T extends TenantDeleteArgs>(args: SelectSubset<T, TenantDeleteArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenant.
     * @param {TenantUpdateArgs} args - Arguments to update one Tenant.
     * @example
     * // Update one Tenant
     * const tenant = await prisma.tenant.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TenantUpdateArgs>(args: SelectSubset<T, TenantUpdateArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenants.
     * @param {TenantDeleteManyArgs} args - Arguments to filter Tenants to delete.
     * @example
     * // Delete a few Tenants
     * const { count } = await prisma.tenant.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TenantDeleteManyArgs>(args?: SelectSubset<T, TenantDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenants
     * const tenant = await prisma.tenant.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TenantUpdateManyArgs>(args: SelectSubset<T, TenantUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenants and returns the data updated in the database.
     * @param {TenantUpdateManyAndReturnArgs} args - Arguments to update many Tenants.
     * @example
     * // Update many Tenants
     * const tenant = await prisma.tenant.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenants and only return the `id`
     * const tenantWithIdOnly = await prisma.tenant.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TenantUpdateManyAndReturnArgs>(args: SelectSubset<T, TenantUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenant.
     * @param {TenantUpsertArgs} args - Arguments to update or create a Tenant.
     * @example
     * // Update or create a Tenant
     * const tenant = await prisma.tenant.upsert({
     *   create: {
     *     // ... data to create a Tenant
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenant we want to update
     *   }
     * })
     */
    upsert<T extends TenantUpsertArgs>(args: SelectSubset<T, TenantUpsertArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantCountArgs} args - Arguments to filter Tenants to count.
     * @example
     * // Count the number of Tenants
     * const count = await prisma.tenant.count({
     *   where: {
     *     // ... the filter for the Tenants we want to count
     *   }
     * })
    **/
    count<T extends TenantCountArgs>(
      args?: Subset<T, TenantCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TenantCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TenantAggregateArgs>(args: Subset<T, TenantAggregateArgs>): Prisma.PrismaPromise<GetTenantAggregateType<T>>

    /**
     * Group by Tenant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TenantGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TenantGroupByArgs['orderBy'] }
        : { orderBy?: TenantGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TenantGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Tenant model
   */
  readonly fields: TenantFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tenant.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TenantClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    domains<T extends Tenant$domainsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$domainsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    websiteConfig<T extends Tenant$websiteConfigArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$websiteConfigArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    controlSettings<T extends Tenant$controlSettingsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$controlSettingsArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    controlActors<T extends Tenant$controlActorsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$controlActorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    contacts<T extends Tenant$contactsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$contactsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    leads<T extends Tenant$leadsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$leadsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    activities<T extends Tenant$activitiesArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$activitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    ingestedEvents<T extends Tenant$ingestedEventsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$ingestedEventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    ingestionQueueJobs<T extends Tenant$ingestionQueueJobsArgs<ExtArgs> = {}>(args?: Subset<T, Tenant$ingestionQueueJobsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Tenant model
   */
  interface TenantFieldRefs {
    readonly id: FieldRef<"Tenant", 'String'>
    readonly slug: FieldRef<"Tenant", 'String'>
    readonly name: FieldRef<"Tenant", 'String'>
    readonly status: FieldRef<"Tenant", 'String'>
    readonly createdAt: FieldRef<"Tenant", 'DateTime'>
    readonly updatedAt: FieldRef<"Tenant", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Tenant findUnique
   */
  export type TenantFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * Filter, which Tenant to fetch.
     */
    where: TenantWhereUniqueInput
  }

  /**
   * Tenant findUniqueOrThrow
   */
  export type TenantFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * Filter, which Tenant to fetch.
     */
    where: TenantWhereUniqueInput
  }

  /**
   * Tenant findFirst
   */
  export type TenantFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * Filter, which Tenant to fetch.
     */
    where?: TenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tenants to fetch.
     */
    orderBy?: TenantOrderByWithRelationInput | TenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tenants.
     */
    cursor?: TenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tenants.
     */
    distinct?: TenantScalarFieldEnum | TenantScalarFieldEnum[]
  }

  /**
   * Tenant findFirstOrThrow
   */
  export type TenantFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * Filter, which Tenant to fetch.
     */
    where?: TenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tenants to fetch.
     */
    orderBy?: TenantOrderByWithRelationInput | TenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tenants.
     */
    cursor?: TenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tenants.
     */
    distinct?: TenantScalarFieldEnum | TenantScalarFieldEnum[]
  }

  /**
   * Tenant findMany
   */
  export type TenantFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * Filter, which Tenants to fetch.
     */
    where?: TenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tenants to fetch.
     */
    orderBy?: TenantOrderByWithRelationInput | TenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tenants.
     */
    cursor?: TenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tenants.
     */
    skip?: number
    distinct?: TenantScalarFieldEnum | TenantScalarFieldEnum[]
  }

  /**
   * Tenant create
   */
  export type TenantCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * The data needed to create a Tenant.
     */
    data: XOR<TenantCreateInput, TenantUncheckedCreateInput>
  }

  /**
   * Tenant createMany
   */
  export type TenantCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tenants.
     */
    data: TenantCreateManyInput | TenantCreateManyInput[]
  }

  /**
   * Tenant createManyAndReturn
   */
  export type TenantCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * The data used to create many Tenants.
     */
    data: TenantCreateManyInput | TenantCreateManyInput[]
  }

  /**
   * Tenant update
   */
  export type TenantUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * The data needed to update a Tenant.
     */
    data: XOR<TenantUpdateInput, TenantUncheckedUpdateInput>
    /**
     * Choose, which Tenant to update.
     */
    where: TenantWhereUniqueInput
  }

  /**
   * Tenant updateMany
   */
  export type TenantUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tenants.
     */
    data: XOR<TenantUpdateManyMutationInput, TenantUncheckedUpdateManyInput>
    /**
     * Filter which Tenants to update
     */
    where?: TenantWhereInput
    /**
     * Limit how many Tenants to update.
     */
    limit?: number
  }

  /**
   * Tenant updateManyAndReturn
   */
  export type TenantUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * The data used to update Tenants.
     */
    data: XOR<TenantUpdateManyMutationInput, TenantUncheckedUpdateManyInput>
    /**
     * Filter which Tenants to update
     */
    where?: TenantWhereInput
    /**
     * Limit how many Tenants to update.
     */
    limit?: number
  }

  /**
   * Tenant upsert
   */
  export type TenantUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * The filter to search for the Tenant to update in case it exists.
     */
    where: TenantWhereUniqueInput
    /**
     * In case the Tenant found by the `where` argument doesn't exist, create a new Tenant with this data.
     */
    create: XOR<TenantCreateInput, TenantUncheckedCreateInput>
    /**
     * In case the Tenant was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TenantUpdateInput, TenantUncheckedUpdateInput>
  }

  /**
   * Tenant delete
   */
  export type TenantDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
    /**
     * Filter which Tenant to delete.
     */
    where: TenantWhereUniqueInput
  }

  /**
   * Tenant deleteMany
   */
  export type TenantDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tenants to delete
     */
    where?: TenantWhereInput
    /**
     * Limit how many Tenants to delete.
     */
    limit?: number
  }

  /**
   * Tenant.domains
   */
  export type Tenant$domainsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    where?: TenantDomainWhereInput
    orderBy?: TenantDomainOrderByWithRelationInput | TenantDomainOrderByWithRelationInput[]
    cursor?: TenantDomainWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TenantDomainScalarFieldEnum | TenantDomainScalarFieldEnum[]
  }

  /**
   * Tenant.websiteConfig
   */
  export type Tenant$websiteConfigArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    where?: WebsiteConfigWhereInput
  }

  /**
   * Tenant.controlSettings
   */
  export type Tenant$controlSettingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    where?: TenantControlSettingsWhereInput
  }

  /**
   * Tenant.controlActors
   */
  export type Tenant$controlActorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    where?: TenantControlActorWhereInput
    orderBy?: TenantControlActorOrderByWithRelationInput | TenantControlActorOrderByWithRelationInput[]
    cursor?: TenantControlActorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TenantControlActorScalarFieldEnum | TenantControlActorScalarFieldEnum[]
  }

  /**
   * Tenant.contacts
   */
  export type Tenant$contactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    where?: ContactWhereInput
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    cursor?: ContactWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Tenant.leads
   */
  export type Tenant$leadsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    where?: LeadWhereInput
    orderBy?: LeadOrderByWithRelationInput | LeadOrderByWithRelationInput[]
    cursor?: LeadWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LeadScalarFieldEnum | LeadScalarFieldEnum[]
  }

  /**
   * Tenant.activities
   */
  export type Tenant$activitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    where?: ActivityWhereInput
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    cursor?: ActivityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Tenant.ingestedEvents
   */
  export type Tenant$ingestedEventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    where?: IngestedEventWhereInput
    orderBy?: IngestedEventOrderByWithRelationInput | IngestedEventOrderByWithRelationInput[]
    cursor?: IngestedEventWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IngestedEventScalarFieldEnum | IngestedEventScalarFieldEnum[]
  }

  /**
   * Tenant.ingestionQueueJobs
   */
  export type Tenant$ingestionQueueJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    where?: IngestionQueueJobWhereInput
    orderBy?: IngestionQueueJobOrderByWithRelationInput | IngestionQueueJobOrderByWithRelationInput[]
    cursor?: IngestionQueueJobWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IngestionQueueJobScalarFieldEnum | IngestionQueueJobScalarFieldEnum[]
  }

  /**
   * Tenant without action
   */
  export type TenantDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tenant
     */
    select?: TenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tenant
     */
    omit?: TenantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantInclude<ExtArgs> | null
  }


  /**
   * Model TenantDomain
   */

  export type AggregateTenantDomain = {
    _count: TenantDomainCountAggregateOutputType | null
    _min: TenantDomainMinAggregateOutputType | null
    _max: TenantDomainMaxAggregateOutputType | null
  }

  export type TenantDomainMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    hostname: string | null
    hostnameNormalized: string | null
    status: string | null
    isPrimary: boolean | null
    isVerified: boolean | null
    verifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantDomainMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    hostname: string | null
    hostnameNormalized: string | null
    status: string | null
    isPrimary: boolean | null
    isVerified: boolean | null
    verifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantDomainCountAggregateOutputType = {
    id: number
    tenantId: number
    hostname: number
    hostnameNormalized: number
    status: number
    isPrimary: number
    isVerified: number
    verifiedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TenantDomainMinAggregateInputType = {
    id?: true
    tenantId?: true
    hostname?: true
    hostnameNormalized?: true
    status?: true
    isPrimary?: true
    isVerified?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantDomainMaxAggregateInputType = {
    id?: true
    tenantId?: true
    hostname?: true
    hostnameNormalized?: true
    status?: true
    isPrimary?: true
    isVerified?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantDomainCountAggregateInputType = {
    id?: true
    tenantId?: true
    hostname?: true
    hostnameNormalized?: true
    status?: true
    isPrimary?: true
    isVerified?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TenantDomainAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TenantDomain to aggregate.
     */
    where?: TenantDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantDomains to fetch.
     */
    orderBy?: TenantDomainOrderByWithRelationInput | TenantDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TenantDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantDomains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TenantDomains
    **/
    _count?: true | TenantDomainCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TenantDomainMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TenantDomainMaxAggregateInputType
  }

  export type GetTenantDomainAggregateType<T extends TenantDomainAggregateArgs> = {
        [P in keyof T & keyof AggregateTenantDomain]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenantDomain[P]>
      : GetScalarType<T[P], AggregateTenantDomain[P]>
  }




  export type TenantDomainGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TenantDomainWhereInput
    orderBy?: TenantDomainOrderByWithAggregationInput | TenantDomainOrderByWithAggregationInput[]
    by: TenantDomainScalarFieldEnum[] | TenantDomainScalarFieldEnum
    having?: TenantDomainScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TenantDomainCountAggregateInputType | true
    _min?: TenantDomainMinAggregateInputType
    _max?: TenantDomainMaxAggregateInputType
  }

  export type TenantDomainGroupByOutputType = {
    id: string
    tenantId: string
    hostname: string
    hostnameNormalized: string
    status: string
    isPrimary: boolean
    isVerified: boolean
    verifiedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: TenantDomainCountAggregateOutputType | null
    _min: TenantDomainMinAggregateOutputType | null
    _max: TenantDomainMaxAggregateOutputType | null
  }

  type GetTenantDomainGroupByPayload<T extends TenantDomainGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TenantDomainGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TenantDomainGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TenantDomainGroupByOutputType[P]>
            : GetScalarType<T[P], TenantDomainGroupByOutputType[P]>
        }
      >
    >


  export type TenantDomainSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    hostname?: boolean
    hostnameNormalized?: boolean
    status?: boolean
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantDomain"]>

  export type TenantDomainSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    hostname?: boolean
    hostnameNormalized?: boolean
    status?: boolean
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantDomain"]>

  export type TenantDomainSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    hostname?: boolean
    hostnameNormalized?: boolean
    status?: boolean
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantDomain"]>

  export type TenantDomainSelectScalar = {
    id?: boolean
    tenantId?: boolean
    hostname?: boolean
    hostnameNormalized?: boolean
    status?: boolean
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TenantDomainOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "hostname" | "hostnameNormalized" | "status" | "isPrimary" | "isVerified" | "verifiedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["tenantDomain"]>
  export type TenantDomainInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type TenantDomainIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type TenantDomainIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $TenantDomainPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TenantDomain"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      hostname: string
      hostnameNormalized: string
      status: string
      isPrimary: boolean
      isVerified: boolean
      verifiedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["tenantDomain"]>
    composites: {}
  }

  type TenantDomainGetPayload<S extends boolean | null | undefined | TenantDomainDefaultArgs> = $Result.GetResult<Prisma.$TenantDomainPayload, S>

  type TenantDomainCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TenantDomainFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TenantDomainCountAggregateInputType | true
    }

  export interface TenantDomainDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TenantDomain'], meta: { name: 'TenantDomain' } }
    /**
     * Find zero or one TenantDomain that matches the filter.
     * @param {TenantDomainFindUniqueArgs} args - Arguments to find a TenantDomain
     * @example
     * // Get one TenantDomain
     * const tenantDomain = await prisma.tenantDomain.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TenantDomainFindUniqueArgs>(args: SelectSubset<T, TenantDomainFindUniqueArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TenantDomain that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TenantDomainFindUniqueOrThrowArgs} args - Arguments to find a TenantDomain
     * @example
     * // Get one TenantDomain
     * const tenantDomain = await prisma.tenantDomain.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TenantDomainFindUniqueOrThrowArgs>(args: SelectSubset<T, TenantDomainFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TenantDomain that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainFindFirstArgs} args - Arguments to find a TenantDomain
     * @example
     * // Get one TenantDomain
     * const tenantDomain = await prisma.tenantDomain.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TenantDomainFindFirstArgs>(args?: SelectSubset<T, TenantDomainFindFirstArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TenantDomain that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainFindFirstOrThrowArgs} args - Arguments to find a TenantDomain
     * @example
     * // Get one TenantDomain
     * const tenantDomain = await prisma.tenantDomain.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TenantDomainFindFirstOrThrowArgs>(args?: SelectSubset<T, TenantDomainFindFirstOrThrowArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TenantDomains that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TenantDomains
     * const tenantDomains = await prisma.tenantDomain.findMany()
     * 
     * // Get first 10 TenantDomains
     * const tenantDomains = await prisma.tenantDomain.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenantDomainWithIdOnly = await prisma.tenantDomain.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TenantDomainFindManyArgs>(args?: SelectSubset<T, TenantDomainFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TenantDomain.
     * @param {TenantDomainCreateArgs} args - Arguments to create a TenantDomain.
     * @example
     * // Create one TenantDomain
     * const TenantDomain = await prisma.tenantDomain.create({
     *   data: {
     *     // ... data to create a TenantDomain
     *   }
     * })
     * 
     */
    create<T extends TenantDomainCreateArgs>(args: SelectSubset<T, TenantDomainCreateArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TenantDomains.
     * @param {TenantDomainCreateManyArgs} args - Arguments to create many TenantDomains.
     * @example
     * // Create many TenantDomains
     * const tenantDomain = await prisma.tenantDomain.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TenantDomainCreateManyArgs>(args?: SelectSubset<T, TenantDomainCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TenantDomains and returns the data saved in the database.
     * @param {TenantDomainCreateManyAndReturnArgs} args - Arguments to create many TenantDomains.
     * @example
     * // Create many TenantDomains
     * const tenantDomain = await prisma.tenantDomain.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TenantDomains and only return the `id`
     * const tenantDomainWithIdOnly = await prisma.tenantDomain.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TenantDomainCreateManyAndReturnArgs>(args?: SelectSubset<T, TenantDomainCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TenantDomain.
     * @param {TenantDomainDeleteArgs} args - Arguments to delete one TenantDomain.
     * @example
     * // Delete one TenantDomain
     * const TenantDomain = await prisma.tenantDomain.delete({
     *   where: {
     *     // ... filter to delete one TenantDomain
     *   }
     * })
     * 
     */
    delete<T extends TenantDomainDeleteArgs>(args: SelectSubset<T, TenantDomainDeleteArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TenantDomain.
     * @param {TenantDomainUpdateArgs} args - Arguments to update one TenantDomain.
     * @example
     * // Update one TenantDomain
     * const tenantDomain = await prisma.tenantDomain.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TenantDomainUpdateArgs>(args: SelectSubset<T, TenantDomainUpdateArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TenantDomains.
     * @param {TenantDomainDeleteManyArgs} args - Arguments to filter TenantDomains to delete.
     * @example
     * // Delete a few TenantDomains
     * const { count } = await prisma.tenantDomain.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TenantDomainDeleteManyArgs>(args?: SelectSubset<T, TenantDomainDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TenantDomains.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TenantDomains
     * const tenantDomain = await prisma.tenantDomain.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TenantDomainUpdateManyArgs>(args: SelectSubset<T, TenantDomainUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TenantDomains and returns the data updated in the database.
     * @param {TenantDomainUpdateManyAndReturnArgs} args - Arguments to update many TenantDomains.
     * @example
     * // Update many TenantDomains
     * const tenantDomain = await prisma.tenantDomain.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TenantDomains and only return the `id`
     * const tenantDomainWithIdOnly = await prisma.tenantDomain.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TenantDomainUpdateManyAndReturnArgs>(args: SelectSubset<T, TenantDomainUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TenantDomain.
     * @param {TenantDomainUpsertArgs} args - Arguments to update or create a TenantDomain.
     * @example
     * // Update or create a TenantDomain
     * const tenantDomain = await prisma.tenantDomain.upsert({
     *   create: {
     *     // ... data to create a TenantDomain
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TenantDomain we want to update
     *   }
     * })
     */
    upsert<T extends TenantDomainUpsertArgs>(args: SelectSubset<T, TenantDomainUpsertArgs<ExtArgs>>): Prisma__TenantDomainClient<$Result.GetResult<Prisma.$TenantDomainPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TenantDomains.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainCountArgs} args - Arguments to filter TenantDomains to count.
     * @example
     * // Count the number of TenantDomains
     * const count = await prisma.tenantDomain.count({
     *   where: {
     *     // ... the filter for the TenantDomains we want to count
     *   }
     * })
    **/
    count<T extends TenantDomainCountArgs>(
      args?: Subset<T, TenantDomainCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TenantDomainCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TenantDomain.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TenantDomainAggregateArgs>(args: Subset<T, TenantDomainAggregateArgs>): Prisma.PrismaPromise<GetTenantDomainAggregateType<T>>

    /**
     * Group by TenantDomain.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantDomainGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TenantDomainGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TenantDomainGroupByArgs['orderBy'] }
        : { orderBy?: TenantDomainGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TenantDomainGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantDomainGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TenantDomain model
   */
  readonly fields: TenantDomainFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TenantDomain.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TenantDomainClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TenantDomain model
   */
  interface TenantDomainFieldRefs {
    readonly id: FieldRef<"TenantDomain", 'String'>
    readonly tenantId: FieldRef<"TenantDomain", 'String'>
    readonly hostname: FieldRef<"TenantDomain", 'String'>
    readonly hostnameNormalized: FieldRef<"TenantDomain", 'String'>
    readonly status: FieldRef<"TenantDomain", 'String'>
    readonly isPrimary: FieldRef<"TenantDomain", 'Boolean'>
    readonly isVerified: FieldRef<"TenantDomain", 'Boolean'>
    readonly verifiedAt: FieldRef<"TenantDomain", 'DateTime'>
    readonly createdAt: FieldRef<"TenantDomain", 'DateTime'>
    readonly updatedAt: FieldRef<"TenantDomain", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TenantDomain findUnique
   */
  export type TenantDomainFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * Filter, which TenantDomain to fetch.
     */
    where: TenantDomainWhereUniqueInput
  }

  /**
   * TenantDomain findUniqueOrThrow
   */
  export type TenantDomainFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * Filter, which TenantDomain to fetch.
     */
    where: TenantDomainWhereUniqueInput
  }

  /**
   * TenantDomain findFirst
   */
  export type TenantDomainFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * Filter, which TenantDomain to fetch.
     */
    where?: TenantDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantDomains to fetch.
     */
    orderBy?: TenantDomainOrderByWithRelationInput | TenantDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TenantDomains.
     */
    cursor?: TenantDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantDomains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TenantDomains.
     */
    distinct?: TenantDomainScalarFieldEnum | TenantDomainScalarFieldEnum[]
  }

  /**
   * TenantDomain findFirstOrThrow
   */
  export type TenantDomainFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * Filter, which TenantDomain to fetch.
     */
    where?: TenantDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantDomains to fetch.
     */
    orderBy?: TenantDomainOrderByWithRelationInput | TenantDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TenantDomains.
     */
    cursor?: TenantDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantDomains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TenantDomains.
     */
    distinct?: TenantDomainScalarFieldEnum | TenantDomainScalarFieldEnum[]
  }

  /**
   * TenantDomain findMany
   */
  export type TenantDomainFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * Filter, which TenantDomains to fetch.
     */
    where?: TenantDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantDomains to fetch.
     */
    orderBy?: TenantDomainOrderByWithRelationInput | TenantDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TenantDomains.
     */
    cursor?: TenantDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantDomains.
     */
    skip?: number
    distinct?: TenantDomainScalarFieldEnum | TenantDomainScalarFieldEnum[]
  }

  /**
   * TenantDomain create
   */
  export type TenantDomainCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * The data needed to create a TenantDomain.
     */
    data: XOR<TenantDomainCreateInput, TenantDomainUncheckedCreateInput>
  }

  /**
   * TenantDomain createMany
   */
  export type TenantDomainCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TenantDomains.
     */
    data: TenantDomainCreateManyInput | TenantDomainCreateManyInput[]
  }

  /**
   * TenantDomain createManyAndReturn
   */
  export type TenantDomainCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * The data used to create many TenantDomains.
     */
    data: TenantDomainCreateManyInput | TenantDomainCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TenantDomain update
   */
  export type TenantDomainUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * The data needed to update a TenantDomain.
     */
    data: XOR<TenantDomainUpdateInput, TenantDomainUncheckedUpdateInput>
    /**
     * Choose, which TenantDomain to update.
     */
    where: TenantDomainWhereUniqueInput
  }

  /**
   * TenantDomain updateMany
   */
  export type TenantDomainUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TenantDomains.
     */
    data: XOR<TenantDomainUpdateManyMutationInput, TenantDomainUncheckedUpdateManyInput>
    /**
     * Filter which TenantDomains to update
     */
    where?: TenantDomainWhereInput
    /**
     * Limit how many TenantDomains to update.
     */
    limit?: number
  }

  /**
   * TenantDomain updateManyAndReturn
   */
  export type TenantDomainUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * The data used to update TenantDomains.
     */
    data: XOR<TenantDomainUpdateManyMutationInput, TenantDomainUncheckedUpdateManyInput>
    /**
     * Filter which TenantDomains to update
     */
    where?: TenantDomainWhereInput
    /**
     * Limit how many TenantDomains to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TenantDomain upsert
   */
  export type TenantDomainUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * The filter to search for the TenantDomain to update in case it exists.
     */
    where: TenantDomainWhereUniqueInput
    /**
     * In case the TenantDomain found by the `where` argument doesn't exist, create a new TenantDomain with this data.
     */
    create: XOR<TenantDomainCreateInput, TenantDomainUncheckedCreateInput>
    /**
     * In case the TenantDomain was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TenantDomainUpdateInput, TenantDomainUncheckedUpdateInput>
  }

  /**
   * TenantDomain delete
   */
  export type TenantDomainDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
    /**
     * Filter which TenantDomain to delete.
     */
    where: TenantDomainWhereUniqueInput
  }

  /**
   * TenantDomain deleteMany
   */
  export type TenantDomainDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TenantDomains to delete
     */
    where?: TenantDomainWhereInput
    /**
     * Limit how many TenantDomains to delete.
     */
    limit?: number
  }

  /**
   * TenantDomain without action
   */
  export type TenantDomainDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantDomain
     */
    select?: TenantDomainSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantDomain
     */
    omit?: TenantDomainOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantDomainInclude<ExtArgs> | null
  }


  /**
   * Model WebsiteConfig
   */

  export type AggregateWebsiteConfig = {
    _count: WebsiteConfigCountAggregateOutputType | null
    _min: WebsiteConfigMinAggregateOutputType | null
    _max: WebsiteConfigMaxAggregateOutputType | null
  }

  export type WebsiteConfigMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WebsiteConfigMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WebsiteConfigCountAggregateOutputType = {
    id: number
    tenantId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WebsiteConfigMinAggregateInputType = {
    id?: true
    tenantId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WebsiteConfigMaxAggregateInputType = {
    id?: true
    tenantId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WebsiteConfigCountAggregateInputType = {
    id?: true
    tenantId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WebsiteConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebsiteConfig to aggregate.
     */
    where?: WebsiteConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebsiteConfigs to fetch.
     */
    orderBy?: WebsiteConfigOrderByWithRelationInput | WebsiteConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebsiteConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebsiteConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebsiteConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WebsiteConfigs
    **/
    _count?: true | WebsiteConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebsiteConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebsiteConfigMaxAggregateInputType
  }

  export type GetWebsiteConfigAggregateType<T extends WebsiteConfigAggregateArgs> = {
        [P in keyof T & keyof AggregateWebsiteConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebsiteConfig[P]>
      : GetScalarType<T[P], AggregateWebsiteConfig[P]>
  }




  export type WebsiteConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebsiteConfigWhereInput
    orderBy?: WebsiteConfigOrderByWithAggregationInput | WebsiteConfigOrderByWithAggregationInput[]
    by: WebsiteConfigScalarFieldEnum[] | WebsiteConfigScalarFieldEnum
    having?: WebsiteConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebsiteConfigCountAggregateInputType | true
    _min?: WebsiteConfigMinAggregateInputType
    _max?: WebsiteConfigMaxAggregateInputType
  }

  export type WebsiteConfigGroupByOutputType = {
    id: string
    tenantId: string
    createdAt: Date
    updatedAt: Date
    _count: WebsiteConfigCountAggregateOutputType | null
    _min: WebsiteConfigMinAggregateOutputType | null
    _max: WebsiteConfigMaxAggregateOutputType | null
  }

  type GetWebsiteConfigGroupByPayload<T extends WebsiteConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebsiteConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebsiteConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebsiteConfigGroupByOutputType[P]>
            : GetScalarType<T[P], WebsiteConfigGroupByOutputType[P]>
        }
      >
    >


  export type WebsiteConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    modules?: boolean | WebsiteConfig$modulesArgs<ExtArgs>
    _count?: boolean | WebsiteConfigCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["websiteConfig"]>

  export type WebsiteConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["websiteConfig"]>

  export type WebsiteConfigSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["websiteConfig"]>

  export type WebsiteConfigSelectScalar = {
    id?: boolean
    tenantId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WebsiteConfigOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "createdAt" | "updatedAt", ExtArgs["result"]["websiteConfig"]>
  export type WebsiteConfigInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    modules?: boolean | WebsiteConfig$modulesArgs<ExtArgs>
    _count?: boolean | WebsiteConfigCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WebsiteConfigIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type WebsiteConfigIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $WebsiteConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WebsiteConfig"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
      modules: Prisma.$ModuleConfigPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["websiteConfig"]>
    composites: {}
  }

  type WebsiteConfigGetPayload<S extends boolean | null | undefined | WebsiteConfigDefaultArgs> = $Result.GetResult<Prisma.$WebsiteConfigPayload, S>

  type WebsiteConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WebsiteConfigFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WebsiteConfigCountAggregateInputType | true
    }

  export interface WebsiteConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WebsiteConfig'], meta: { name: 'WebsiteConfig' } }
    /**
     * Find zero or one WebsiteConfig that matches the filter.
     * @param {WebsiteConfigFindUniqueArgs} args - Arguments to find a WebsiteConfig
     * @example
     * // Get one WebsiteConfig
     * const websiteConfig = await prisma.websiteConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebsiteConfigFindUniqueArgs>(args: SelectSubset<T, WebsiteConfigFindUniqueArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WebsiteConfig that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WebsiteConfigFindUniqueOrThrowArgs} args - Arguments to find a WebsiteConfig
     * @example
     * // Get one WebsiteConfig
     * const websiteConfig = await prisma.websiteConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebsiteConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, WebsiteConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebsiteConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigFindFirstArgs} args - Arguments to find a WebsiteConfig
     * @example
     * // Get one WebsiteConfig
     * const websiteConfig = await prisma.websiteConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebsiteConfigFindFirstArgs>(args?: SelectSubset<T, WebsiteConfigFindFirstArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebsiteConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigFindFirstOrThrowArgs} args - Arguments to find a WebsiteConfig
     * @example
     * // Get one WebsiteConfig
     * const websiteConfig = await prisma.websiteConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebsiteConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, WebsiteConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WebsiteConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WebsiteConfigs
     * const websiteConfigs = await prisma.websiteConfig.findMany()
     * 
     * // Get first 10 WebsiteConfigs
     * const websiteConfigs = await prisma.websiteConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const websiteConfigWithIdOnly = await prisma.websiteConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebsiteConfigFindManyArgs>(args?: SelectSubset<T, WebsiteConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WebsiteConfig.
     * @param {WebsiteConfigCreateArgs} args - Arguments to create a WebsiteConfig.
     * @example
     * // Create one WebsiteConfig
     * const WebsiteConfig = await prisma.websiteConfig.create({
     *   data: {
     *     // ... data to create a WebsiteConfig
     *   }
     * })
     * 
     */
    create<T extends WebsiteConfigCreateArgs>(args: SelectSubset<T, WebsiteConfigCreateArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WebsiteConfigs.
     * @param {WebsiteConfigCreateManyArgs} args - Arguments to create many WebsiteConfigs.
     * @example
     * // Create many WebsiteConfigs
     * const websiteConfig = await prisma.websiteConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebsiteConfigCreateManyArgs>(args?: SelectSubset<T, WebsiteConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WebsiteConfigs and returns the data saved in the database.
     * @param {WebsiteConfigCreateManyAndReturnArgs} args - Arguments to create many WebsiteConfigs.
     * @example
     * // Create many WebsiteConfigs
     * const websiteConfig = await prisma.websiteConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WebsiteConfigs and only return the `id`
     * const websiteConfigWithIdOnly = await prisma.websiteConfig.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebsiteConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, WebsiteConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WebsiteConfig.
     * @param {WebsiteConfigDeleteArgs} args - Arguments to delete one WebsiteConfig.
     * @example
     * // Delete one WebsiteConfig
     * const WebsiteConfig = await prisma.websiteConfig.delete({
     *   where: {
     *     // ... filter to delete one WebsiteConfig
     *   }
     * })
     * 
     */
    delete<T extends WebsiteConfigDeleteArgs>(args: SelectSubset<T, WebsiteConfigDeleteArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WebsiteConfig.
     * @param {WebsiteConfigUpdateArgs} args - Arguments to update one WebsiteConfig.
     * @example
     * // Update one WebsiteConfig
     * const websiteConfig = await prisma.websiteConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebsiteConfigUpdateArgs>(args: SelectSubset<T, WebsiteConfigUpdateArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WebsiteConfigs.
     * @param {WebsiteConfigDeleteManyArgs} args - Arguments to filter WebsiteConfigs to delete.
     * @example
     * // Delete a few WebsiteConfigs
     * const { count } = await prisma.websiteConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebsiteConfigDeleteManyArgs>(args?: SelectSubset<T, WebsiteConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebsiteConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WebsiteConfigs
     * const websiteConfig = await prisma.websiteConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebsiteConfigUpdateManyArgs>(args: SelectSubset<T, WebsiteConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebsiteConfigs and returns the data updated in the database.
     * @param {WebsiteConfigUpdateManyAndReturnArgs} args - Arguments to update many WebsiteConfigs.
     * @example
     * // Update many WebsiteConfigs
     * const websiteConfig = await prisma.websiteConfig.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WebsiteConfigs and only return the `id`
     * const websiteConfigWithIdOnly = await prisma.websiteConfig.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WebsiteConfigUpdateManyAndReturnArgs>(args: SelectSubset<T, WebsiteConfigUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WebsiteConfig.
     * @param {WebsiteConfigUpsertArgs} args - Arguments to update or create a WebsiteConfig.
     * @example
     * // Update or create a WebsiteConfig
     * const websiteConfig = await prisma.websiteConfig.upsert({
     *   create: {
     *     // ... data to create a WebsiteConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WebsiteConfig we want to update
     *   }
     * })
     */
    upsert<T extends WebsiteConfigUpsertArgs>(args: SelectSubset<T, WebsiteConfigUpsertArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WebsiteConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigCountArgs} args - Arguments to filter WebsiteConfigs to count.
     * @example
     * // Count the number of WebsiteConfigs
     * const count = await prisma.websiteConfig.count({
     *   where: {
     *     // ... the filter for the WebsiteConfigs we want to count
     *   }
     * })
    **/
    count<T extends WebsiteConfigCountArgs>(
      args?: Subset<T, WebsiteConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebsiteConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WebsiteConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebsiteConfigAggregateArgs>(args: Subset<T, WebsiteConfigAggregateArgs>): Prisma.PrismaPromise<GetWebsiteConfigAggregateType<T>>

    /**
     * Group by WebsiteConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebsiteConfigGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebsiteConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebsiteConfigGroupByArgs['orderBy'] }
        : { orderBy?: WebsiteConfigGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebsiteConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebsiteConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WebsiteConfig model
   */
  readonly fields: WebsiteConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WebsiteConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebsiteConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    modules<T extends WebsiteConfig$modulesArgs<ExtArgs> = {}>(args?: Subset<T, WebsiteConfig$modulesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WebsiteConfig model
   */
  interface WebsiteConfigFieldRefs {
    readonly id: FieldRef<"WebsiteConfig", 'String'>
    readonly tenantId: FieldRef<"WebsiteConfig", 'String'>
    readonly createdAt: FieldRef<"WebsiteConfig", 'DateTime'>
    readonly updatedAt: FieldRef<"WebsiteConfig", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WebsiteConfig findUnique
   */
  export type WebsiteConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * Filter, which WebsiteConfig to fetch.
     */
    where: WebsiteConfigWhereUniqueInput
  }

  /**
   * WebsiteConfig findUniqueOrThrow
   */
  export type WebsiteConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * Filter, which WebsiteConfig to fetch.
     */
    where: WebsiteConfigWhereUniqueInput
  }

  /**
   * WebsiteConfig findFirst
   */
  export type WebsiteConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * Filter, which WebsiteConfig to fetch.
     */
    where?: WebsiteConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebsiteConfigs to fetch.
     */
    orderBy?: WebsiteConfigOrderByWithRelationInput | WebsiteConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebsiteConfigs.
     */
    cursor?: WebsiteConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebsiteConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebsiteConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebsiteConfigs.
     */
    distinct?: WebsiteConfigScalarFieldEnum | WebsiteConfigScalarFieldEnum[]
  }

  /**
   * WebsiteConfig findFirstOrThrow
   */
  export type WebsiteConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * Filter, which WebsiteConfig to fetch.
     */
    where?: WebsiteConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebsiteConfigs to fetch.
     */
    orderBy?: WebsiteConfigOrderByWithRelationInput | WebsiteConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebsiteConfigs.
     */
    cursor?: WebsiteConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebsiteConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebsiteConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebsiteConfigs.
     */
    distinct?: WebsiteConfigScalarFieldEnum | WebsiteConfigScalarFieldEnum[]
  }

  /**
   * WebsiteConfig findMany
   */
  export type WebsiteConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * Filter, which WebsiteConfigs to fetch.
     */
    where?: WebsiteConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebsiteConfigs to fetch.
     */
    orderBy?: WebsiteConfigOrderByWithRelationInput | WebsiteConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WebsiteConfigs.
     */
    cursor?: WebsiteConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebsiteConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebsiteConfigs.
     */
    skip?: number
    distinct?: WebsiteConfigScalarFieldEnum | WebsiteConfigScalarFieldEnum[]
  }

  /**
   * WebsiteConfig create
   */
  export type WebsiteConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * The data needed to create a WebsiteConfig.
     */
    data: XOR<WebsiteConfigCreateInput, WebsiteConfigUncheckedCreateInput>
  }

  /**
   * WebsiteConfig createMany
   */
  export type WebsiteConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WebsiteConfigs.
     */
    data: WebsiteConfigCreateManyInput | WebsiteConfigCreateManyInput[]
  }

  /**
   * WebsiteConfig createManyAndReturn
   */
  export type WebsiteConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * The data used to create many WebsiteConfigs.
     */
    data: WebsiteConfigCreateManyInput | WebsiteConfigCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WebsiteConfig update
   */
  export type WebsiteConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * The data needed to update a WebsiteConfig.
     */
    data: XOR<WebsiteConfigUpdateInput, WebsiteConfigUncheckedUpdateInput>
    /**
     * Choose, which WebsiteConfig to update.
     */
    where: WebsiteConfigWhereUniqueInput
  }

  /**
   * WebsiteConfig updateMany
   */
  export type WebsiteConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WebsiteConfigs.
     */
    data: XOR<WebsiteConfigUpdateManyMutationInput, WebsiteConfigUncheckedUpdateManyInput>
    /**
     * Filter which WebsiteConfigs to update
     */
    where?: WebsiteConfigWhereInput
    /**
     * Limit how many WebsiteConfigs to update.
     */
    limit?: number
  }

  /**
   * WebsiteConfig updateManyAndReturn
   */
  export type WebsiteConfigUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * The data used to update WebsiteConfigs.
     */
    data: XOR<WebsiteConfigUpdateManyMutationInput, WebsiteConfigUncheckedUpdateManyInput>
    /**
     * Filter which WebsiteConfigs to update
     */
    where?: WebsiteConfigWhereInput
    /**
     * Limit how many WebsiteConfigs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WebsiteConfig upsert
   */
  export type WebsiteConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * The filter to search for the WebsiteConfig to update in case it exists.
     */
    where: WebsiteConfigWhereUniqueInput
    /**
     * In case the WebsiteConfig found by the `where` argument doesn't exist, create a new WebsiteConfig with this data.
     */
    create: XOR<WebsiteConfigCreateInput, WebsiteConfigUncheckedCreateInput>
    /**
     * In case the WebsiteConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebsiteConfigUpdateInput, WebsiteConfigUncheckedUpdateInput>
  }

  /**
   * WebsiteConfig delete
   */
  export type WebsiteConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
    /**
     * Filter which WebsiteConfig to delete.
     */
    where: WebsiteConfigWhereUniqueInput
  }

  /**
   * WebsiteConfig deleteMany
   */
  export type WebsiteConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebsiteConfigs to delete
     */
    where?: WebsiteConfigWhereInput
    /**
     * Limit how many WebsiteConfigs to delete.
     */
    limit?: number
  }

  /**
   * WebsiteConfig.modules
   */
  export type WebsiteConfig$modulesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    where?: ModuleConfigWhereInput
    orderBy?: ModuleConfigOrderByWithRelationInput | ModuleConfigOrderByWithRelationInput[]
    cursor?: ModuleConfigWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ModuleConfigScalarFieldEnum | ModuleConfigScalarFieldEnum[]
  }

  /**
   * WebsiteConfig without action
   */
  export type WebsiteConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebsiteConfig
     */
    select?: WebsiteConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebsiteConfig
     */
    omit?: WebsiteConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebsiteConfigInclude<ExtArgs> | null
  }


  /**
   * Model TenantControlSettings
   */

  export type AggregateTenantControlSettings = {
    _count: TenantControlSettingsCountAggregateOutputType | null
    _min: TenantControlSettingsMinAggregateOutputType | null
    _max: TenantControlSettingsMaxAggregateOutputType | null
  }

  export type TenantControlSettingsMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    status: string | null
    planCode: string | null
    featureFlagsJson: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantControlSettingsMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    status: string | null
    planCode: string | null
    featureFlagsJson: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantControlSettingsCountAggregateOutputType = {
    id: number
    tenantId: number
    status: number
    planCode: number
    featureFlagsJson: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TenantControlSettingsMinAggregateInputType = {
    id?: true
    tenantId?: true
    status?: true
    planCode?: true
    featureFlagsJson?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantControlSettingsMaxAggregateInputType = {
    id?: true
    tenantId?: true
    status?: true
    planCode?: true
    featureFlagsJson?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantControlSettingsCountAggregateInputType = {
    id?: true
    tenantId?: true
    status?: true
    planCode?: true
    featureFlagsJson?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TenantControlSettingsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TenantControlSettings to aggregate.
     */
    where?: TenantControlSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlSettings to fetch.
     */
    orderBy?: TenantControlSettingsOrderByWithRelationInput | TenantControlSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TenantControlSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TenantControlSettings
    **/
    _count?: true | TenantControlSettingsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TenantControlSettingsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TenantControlSettingsMaxAggregateInputType
  }

  export type GetTenantControlSettingsAggregateType<T extends TenantControlSettingsAggregateArgs> = {
        [P in keyof T & keyof AggregateTenantControlSettings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenantControlSettings[P]>
      : GetScalarType<T[P], AggregateTenantControlSettings[P]>
  }




  export type TenantControlSettingsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TenantControlSettingsWhereInput
    orderBy?: TenantControlSettingsOrderByWithAggregationInput | TenantControlSettingsOrderByWithAggregationInput[]
    by: TenantControlSettingsScalarFieldEnum[] | TenantControlSettingsScalarFieldEnum
    having?: TenantControlSettingsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TenantControlSettingsCountAggregateInputType | true
    _min?: TenantControlSettingsMinAggregateInputType
    _max?: TenantControlSettingsMaxAggregateInputType
  }

  export type TenantControlSettingsGroupByOutputType = {
    id: string
    tenantId: string
    status: string
    planCode: string
    featureFlagsJson: string
    createdAt: Date
    updatedAt: Date
    _count: TenantControlSettingsCountAggregateOutputType | null
    _min: TenantControlSettingsMinAggregateOutputType | null
    _max: TenantControlSettingsMaxAggregateOutputType | null
  }

  type GetTenantControlSettingsGroupByPayload<T extends TenantControlSettingsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TenantControlSettingsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TenantControlSettingsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TenantControlSettingsGroupByOutputType[P]>
            : GetScalarType<T[P], TenantControlSettingsGroupByOutputType[P]>
        }
      >
    >


  export type TenantControlSettingsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    status?: boolean
    planCode?: boolean
    featureFlagsJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantControlSettings"]>

  export type TenantControlSettingsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    status?: boolean
    planCode?: boolean
    featureFlagsJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantControlSettings"]>

  export type TenantControlSettingsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    status?: boolean
    planCode?: boolean
    featureFlagsJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantControlSettings"]>

  export type TenantControlSettingsSelectScalar = {
    id?: boolean
    tenantId?: boolean
    status?: boolean
    planCode?: boolean
    featureFlagsJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TenantControlSettingsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "status" | "planCode" | "featureFlagsJson" | "createdAt" | "updatedAt", ExtArgs["result"]["tenantControlSettings"]>
  export type TenantControlSettingsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type TenantControlSettingsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type TenantControlSettingsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $TenantControlSettingsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TenantControlSettings"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      status: string
      planCode: string
      featureFlagsJson: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["tenantControlSettings"]>
    composites: {}
  }

  type TenantControlSettingsGetPayload<S extends boolean | null | undefined | TenantControlSettingsDefaultArgs> = $Result.GetResult<Prisma.$TenantControlSettingsPayload, S>

  type TenantControlSettingsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TenantControlSettingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TenantControlSettingsCountAggregateInputType | true
    }

  export interface TenantControlSettingsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TenantControlSettings'], meta: { name: 'TenantControlSettings' } }
    /**
     * Find zero or one TenantControlSettings that matches the filter.
     * @param {TenantControlSettingsFindUniqueArgs} args - Arguments to find a TenantControlSettings
     * @example
     * // Get one TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TenantControlSettingsFindUniqueArgs>(args: SelectSubset<T, TenantControlSettingsFindUniqueArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TenantControlSettings that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TenantControlSettingsFindUniqueOrThrowArgs} args - Arguments to find a TenantControlSettings
     * @example
     * // Get one TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TenantControlSettingsFindUniqueOrThrowArgs>(args: SelectSubset<T, TenantControlSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TenantControlSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsFindFirstArgs} args - Arguments to find a TenantControlSettings
     * @example
     * // Get one TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TenantControlSettingsFindFirstArgs>(args?: SelectSubset<T, TenantControlSettingsFindFirstArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TenantControlSettings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsFindFirstOrThrowArgs} args - Arguments to find a TenantControlSettings
     * @example
     * // Get one TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TenantControlSettingsFindFirstOrThrowArgs>(args?: SelectSubset<T, TenantControlSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TenantControlSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.findMany()
     * 
     * // Get first 10 TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenantControlSettingsWithIdOnly = await prisma.tenantControlSettings.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TenantControlSettingsFindManyArgs>(args?: SelectSubset<T, TenantControlSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TenantControlSettings.
     * @param {TenantControlSettingsCreateArgs} args - Arguments to create a TenantControlSettings.
     * @example
     * // Create one TenantControlSettings
     * const TenantControlSettings = await prisma.tenantControlSettings.create({
     *   data: {
     *     // ... data to create a TenantControlSettings
     *   }
     * })
     * 
     */
    create<T extends TenantControlSettingsCreateArgs>(args: SelectSubset<T, TenantControlSettingsCreateArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TenantControlSettings.
     * @param {TenantControlSettingsCreateManyArgs} args - Arguments to create many TenantControlSettings.
     * @example
     * // Create many TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TenantControlSettingsCreateManyArgs>(args?: SelectSubset<T, TenantControlSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TenantControlSettings and returns the data saved in the database.
     * @param {TenantControlSettingsCreateManyAndReturnArgs} args - Arguments to create many TenantControlSettings.
     * @example
     * // Create many TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TenantControlSettings and only return the `id`
     * const tenantControlSettingsWithIdOnly = await prisma.tenantControlSettings.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TenantControlSettingsCreateManyAndReturnArgs>(args?: SelectSubset<T, TenantControlSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TenantControlSettings.
     * @param {TenantControlSettingsDeleteArgs} args - Arguments to delete one TenantControlSettings.
     * @example
     * // Delete one TenantControlSettings
     * const TenantControlSettings = await prisma.tenantControlSettings.delete({
     *   where: {
     *     // ... filter to delete one TenantControlSettings
     *   }
     * })
     * 
     */
    delete<T extends TenantControlSettingsDeleteArgs>(args: SelectSubset<T, TenantControlSettingsDeleteArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TenantControlSettings.
     * @param {TenantControlSettingsUpdateArgs} args - Arguments to update one TenantControlSettings.
     * @example
     * // Update one TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TenantControlSettingsUpdateArgs>(args: SelectSubset<T, TenantControlSettingsUpdateArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TenantControlSettings.
     * @param {TenantControlSettingsDeleteManyArgs} args - Arguments to filter TenantControlSettings to delete.
     * @example
     * // Delete a few TenantControlSettings
     * const { count } = await prisma.tenantControlSettings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TenantControlSettingsDeleteManyArgs>(args?: SelectSubset<T, TenantControlSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TenantControlSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TenantControlSettingsUpdateManyArgs>(args: SelectSubset<T, TenantControlSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TenantControlSettings and returns the data updated in the database.
     * @param {TenantControlSettingsUpdateManyAndReturnArgs} args - Arguments to update many TenantControlSettings.
     * @example
     * // Update many TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TenantControlSettings and only return the `id`
     * const tenantControlSettingsWithIdOnly = await prisma.tenantControlSettings.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TenantControlSettingsUpdateManyAndReturnArgs>(args: SelectSubset<T, TenantControlSettingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TenantControlSettings.
     * @param {TenantControlSettingsUpsertArgs} args - Arguments to update or create a TenantControlSettings.
     * @example
     * // Update or create a TenantControlSettings
     * const tenantControlSettings = await prisma.tenantControlSettings.upsert({
     *   create: {
     *     // ... data to create a TenantControlSettings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TenantControlSettings we want to update
     *   }
     * })
     */
    upsert<T extends TenantControlSettingsUpsertArgs>(args: SelectSubset<T, TenantControlSettingsUpsertArgs<ExtArgs>>): Prisma__TenantControlSettingsClient<$Result.GetResult<Prisma.$TenantControlSettingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TenantControlSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsCountArgs} args - Arguments to filter TenantControlSettings to count.
     * @example
     * // Count the number of TenantControlSettings
     * const count = await prisma.tenantControlSettings.count({
     *   where: {
     *     // ... the filter for the TenantControlSettings we want to count
     *   }
     * })
    **/
    count<T extends TenantControlSettingsCountArgs>(
      args?: Subset<T, TenantControlSettingsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TenantControlSettingsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TenantControlSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TenantControlSettingsAggregateArgs>(args: Subset<T, TenantControlSettingsAggregateArgs>): Prisma.PrismaPromise<GetTenantControlSettingsAggregateType<T>>

    /**
     * Group by TenantControlSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlSettingsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TenantControlSettingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TenantControlSettingsGroupByArgs['orderBy'] }
        : { orderBy?: TenantControlSettingsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TenantControlSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantControlSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TenantControlSettings model
   */
  readonly fields: TenantControlSettingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TenantControlSettings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TenantControlSettingsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TenantControlSettings model
   */
  interface TenantControlSettingsFieldRefs {
    readonly id: FieldRef<"TenantControlSettings", 'String'>
    readonly tenantId: FieldRef<"TenantControlSettings", 'String'>
    readonly status: FieldRef<"TenantControlSettings", 'String'>
    readonly planCode: FieldRef<"TenantControlSettings", 'String'>
    readonly featureFlagsJson: FieldRef<"TenantControlSettings", 'String'>
    readonly createdAt: FieldRef<"TenantControlSettings", 'DateTime'>
    readonly updatedAt: FieldRef<"TenantControlSettings", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TenantControlSettings findUnique
   */
  export type TenantControlSettingsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlSettings to fetch.
     */
    where: TenantControlSettingsWhereUniqueInput
  }

  /**
   * TenantControlSettings findUniqueOrThrow
   */
  export type TenantControlSettingsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlSettings to fetch.
     */
    where: TenantControlSettingsWhereUniqueInput
  }

  /**
   * TenantControlSettings findFirst
   */
  export type TenantControlSettingsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlSettings to fetch.
     */
    where?: TenantControlSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlSettings to fetch.
     */
    orderBy?: TenantControlSettingsOrderByWithRelationInput | TenantControlSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TenantControlSettings.
     */
    cursor?: TenantControlSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TenantControlSettings.
     */
    distinct?: TenantControlSettingsScalarFieldEnum | TenantControlSettingsScalarFieldEnum[]
  }

  /**
   * TenantControlSettings findFirstOrThrow
   */
  export type TenantControlSettingsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlSettings to fetch.
     */
    where?: TenantControlSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlSettings to fetch.
     */
    orderBy?: TenantControlSettingsOrderByWithRelationInput | TenantControlSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TenantControlSettings.
     */
    cursor?: TenantControlSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TenantControlSettings.
     */
    distinct?: TenantControlSettingsScalarFieldEnum | TenantControlSettingsScalarFieldEnum[]
  }

  /**
   * TenantControlSettings findMany
   */
  export type TenantControlSettingsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlSettings to fetch.
     */
    where?: TenantControlSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlSettings to fetch.
     */
    orderBy?: TenantControlSettingsOrderByWithRelationInput | TenantControlSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TenantControlSettings.
     */
    cursor?: TenantControlSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlSettings.
     */
    skip?: number
    distinct?: TenantControlSettingsScalarFieldEnum | TenantControlSettingsScalarFieldEnum[]
  }

  /**
   * TenantControlSettings create
   */
  export type TenantControlSettingsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * The data needed to create a TenantControlSettings.
     */
    data: XOR<TenantControlSettingsCreateInput, TenantControlSettingsUncheckedCreateInput>
  }

  /**
   * TenantControlSettings createMany
   */
  export type TenantControlSettingsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TenantControlSettings.
     */
    data: TenantControlSettingsCreateManyInput | TenantControlSettingsCreateManyInput[]
  }

  /**
   * TenantControlSettings createManyAndReturn
   */
  export type TenantControlSettingsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * The data used to create many TenantControlSettings.
     */
    data: TenantControlSettingsCreateManyInput | TenantControlSettingsCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TenantControlSettings update
   */
  export type TenantControlSettingsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * The data needed to update a TenantControlSettings.
     */
    data: XOR<TenantControlSettingsUpdateInput, TenantControlSettingsUncheckedUpdateInput>
    /**
     * Choose, which TenantControlSettings to update.
     */
    where: TenantControlSettingsWhereUniqueInput
  }

  /**
   * TenantControlSettings updateMany
   */
  export type TenantControlSettingsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TenantControlSettings.
     */
    data: XOR<TenantControlSettingsUpdateManyMutationInput, TenantControlSettingsUncheckedUpdateManyInput>
    /**
     * Filter which TenantControlSettings to update
     */
    where?: TenantControlSettingsWhereInput
    /**
     * Limit how many TenantControlSettings to update.
     */
    limit?: number
  }

  /**
   * TenantControlSettings updateManyAndReturn
   */
  export type TenantControlSettingsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * The data used to update TenantControlSettings.
     */
    data: XOR<TenantControlSettingsUpdateManyMutationInput, TenantControlSettingsUncheckedUpdateManyInput>
    /**
     * Filter which TenantControlSettings to update
     */
    where?: TenantControlSettingsWhereInput
    /**
     * Limit how many TenantControlSettings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TenantControlSettings upsert
   */
  export type TenantControlSettingsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * The filter to search for the TenantControlSettings to update in case it exists.
     */
    where: TenantControlSettingsWhereUniqueInput
    /**
     * In case the TenantControlSettings found by the `where` argument doesn't exist, create a new TenantControlSettings with this data.
     */
    create: XOR<TenantControlSettingsCreateInput, TenantControlSettingsUncheckedCreateInput>
    /**
     * In case the TenantControlSettings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TenantControlSettingsUpdateInput, TenantControlSettingsUncheckedUpdateInput>
  }

  /**
   * TenantControlSettings delete
   */
  export type TenantControlSettingsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
    /**
     * Filter which TenantControlSettings to delete.
     */
    where: TenantControlSettingsWhereUniqueInput
  }

  /**
   * TenantControlSettings deleteMany
   */
  export type TenantControlSettingsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TenantControlSettings to delete
     */
    where?: TenantControlSettingsWhereInput
    /**
     * Limit how many TenantControlSettings to delete.
     */
    limit?: number
  }

  /**
   * TenantControlSettings without action
   */
  export type TenantControlSettingsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlSettings
     */
    select?: TenantControlSettingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlSettings
     */
    omit?: TenantControlSettingsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlSettingsInclude<ExtArgs> | null
  }


  /**
   * Model TenantControlActor
   */

  export type AggregateTenantControlActor = {
    _count: TenantControlActorCountAggregateOutputType | null
    _min: TenantControlActorMinAggregateOutputType | null
    _max: TenantControlActorMaxAggregateOutputType | null
  }

  export type TenantControlActorMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    actorId: string | null
    displayName: string | null
    email: string | null
    role: string | null
    permissionsJson: string | null
    supportSessionActive: boolean | null
    supportSessionStartedAt: Date | null
    supportSessionExpiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantControlActorMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    actorId: string | null
    displayName: string | null
    email: string | null
    role: string | null
    permissionsJson: string | null
    supportSessionActive: boolean | null
    supportSessionStartedAt: Date | null
    supportSessionExpiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TenantControlActorCountAggregateOutputType = {
    id: number
    tenantId: number
    actorId: number
    displayName: number
    email: number
    role: number
    permissionsJson: number
    supportSessionActive: number
    supportSessionStartedAt: number
    supportSessionExpiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TenantControlActorMinAggregateInputType = {
    id?: true
    tenantId?: true
    actorId?: true
    displayName?: true
    email?: true
    role?: true
    permissionsJson?: true
    supportSessionActive?: true
    supportSessionStartedAt?: true
    supportSessionExpiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantControlActorMaxAggregateInputType = {
    id?: true
    tenantId?: true
    actorId?: true
    displayName?: true
    email?: true
    role?: true
    permissionsJson?: true
    supportSessionActive?: true
    supportSessionStartedAt?: true
    supportSessionExpiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TenantControlActorCountAggregateInputType = {
    id?: true
    tenantId?: true
    actorId?: true
    displayName?: true
    email?: true
    role?: true
    permissionsJson?: true
    supportSessionActive?: true
    supportSessionStartedAt?: true
    supportSessionExpiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TenantControlActorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TenantControlActor to aggregate.
     */
    where?: TenantControlActorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlActors to fetch.
     */
    orderBy?: TenantControlActorOrderByWithRelationInput | TenantControlActorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TenantControlActorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlActors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlActors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TenantControlActors
    **/
    _count?: true | TenantControlActorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TenantControlActorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TenantControlActorMaxAggregateInputType
  }

  export type GetTenantControlActorAggregateType<T extends TenantControlActorAggregateArgs> = {
        [P in keyof T & keyof AggregateTenantControlActor]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenantControlActor[P]>
      : GetScalarType<T[P], AggregateTenantControlActor[P]>
  }




  export type TenantControlActorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TenantControlActorWhereInput
    orderBy?: TenantControlActorOrderByWithAggregationInput | TenantControlActorOrderByWithAggregationInput[]
    by: TenantControlActorScalarFieldEnum[] | TenantControlActorScalarFieldEnum
    having?: TenantControlActorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TenantControlActorCountAggregateInputType | true
    _min?: TenantControlActorMinAggregateInputType
    _max?: TenantControlActorMaxAggregateInputType
  }

  export type TenantControlActorGroupByOutputType = {
    id: string
    tenantId: string
    actorId: string
    displayName: string | null
    email: string | null
    role: string
    permissionsJson: string
    supportSessionActive: boolean
    supportSessionStartedAt: Date | null
    supportSessionExpiresAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: TenantControlActorCountAggregateOutputType | null
    _min: TenantControlActorMinAggregateOutputType | null
    _max: TenantControlActorMaxAggregateOutputType | null
  }

  type GetTenantControlActorGroupByPayload<T extends TenantControlActorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TenantControlActorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TenantControlActorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TenantControlActorGroupByOutputType[P]>
            : GetScalarType<T[P], TenantControlActorGroupByOutputType[P]>
        }
      >
    >


  export type TenantControlActorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    actorId?: boolean
    displayName?: boolean
    email?: boolean
    role?: boolean
    permissionsJson?: boolean
    supportSessionActive?: boolean
    supportSessionStartedAt?: boolean
    supportSessionExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantControlActor"]>

  export type TenantControlActorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    actorId?: boolean
    displayName?: boolean
    email?: boolean
    role?: boolean
    permissionsJson?: boolean
    supportSessionActive?: boolean
    supportSessionStartedAt?: boolean
    supportSessionExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantControlActor"]>

  export type TenantControlActorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    actorId?: boolean
    displayName?: boolean
    email?: boolean
    role?: boolean
    permissionsJson?: boolean
    supportSessionActive?: boolean
    supportSessionStartedAt?: boolean
    supportSessionExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenantControlActor"]>

  export type TenantControlActorSelectScalar = {
    id?: boolean
    tenantId?: boolean
    actorId?: boolean
    displayName?: boolean
    email?: boolean
    role?: boolean
    permissionsJson?: boolean
    supportSessionActive?: boolean
    supportSessionStartedAt?: boolean
    supportSessionExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TenantControlActorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "actorId" | "displayName" | "email" | "role" | "permissionsJson" | "supportSessionActive" | "supportSessionStartedAt" | "supportSessionExpiresAt" | "createdAt" | "updatedAt", ExtArgs["result"]["tenantControlActor"]>
  export type TenantControlActorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type TenantControlActorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type TenantControlActorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $TenantControlActorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TenantControlActor"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      actorId: string
      displayName: string | null
      email: string | null
      role: string
      permissionsJson: string
      supportSessionActive: boolean
      supportSessionStartedAt: Date | null
      supportSessionExpiresAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["tenantControlActor"]>
    composites: {}
  }

  type TenantControlActorGetPayload<S extends boolean | null | undefined | TenantControlActorDefaultArgs> = $Result.GetResult<Prisma.$TenantControlActorPayload, S>

  type TenantControlActorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TenantControlActorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TenantControlActorCountAggregateInputType | true
    }

  export interface TenantControlActorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TenantControlActor'], meta: { name: 'TenantControlActor' } }
    /**
     * Find zero or one TenantControlActor that matches the filter.
     * @param {TenantControlActorFindUniqueArgs} args - Arguments to find a TenantControlActor
     * @example
     * // Get one TenantControlActor
     * const tenantControlActor = await prisma.tenantControlActor.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TenantControlActorFindUniqueArgs>(args: SelectSubset<T, TenantControlActorFindUniqueArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TenantControlActor that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TenantControlActorFindUniqueOrThrowArgs} args - Arguments to find a TenantControlActor
     * @example
     * // Get one TenantControlActor
     * const tenantControlActor = await prisma.tenantControlActor.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TenantControlActorFindUniqueOrThrowArgs>(args: SelectSubset<T, TenantControlActorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TenantControlActor that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorFindFirstArgs} args - Arguments to find a TenantControlActor
     * @example
     * // Get one TenantControlActor
     * const tenantControlActor = await prisma.tenantControlActor.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TenantControlActorFindFirstArgs>(args?: SelectSubset<T, TenantControlActorFindFirstArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TenantControlActor that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorFindFirstOrThrowArgs} args - Arguments to find a TenantControlActor
     * @example
     * // Get one TenantControlActor
     * const tenantControlActor = await prisma.tenantControlActor.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TenantControlActorFindFirstOrThrowArgs>(args?: SelectSubset<T, TenantControlActorFindFirstOrThrowArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TenantControlActors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TenantControlActors
     * const tenantControlActors = await prisma.tenantControlActor.findMany()
     * 
     * // Get first 10 TenantControlActors
     * const tenantControlActors = await prisma.tenantControlActor.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenantControlActorWithIdOnly = await prisma.tenantControlActor.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TenantControlActorFindManyArgs>(args?: SelectSubset<T, TenantControlActorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TenantControlActor.
     * @param {TenantControlActorCreateArgs} args - Arguments to create a TenantControlActor.
     * @example
     * // Create one TenantControlActor
     * const TenantControlActor = await prisma.tenantControlActor.create({
     *   data: {
     *     // ... data to create a TenantControlActor
     *   }
     * })
     * 
     */
    create<T extends TenantControlActorCreateArgs>(args: SelectSubset<T, TenantControlActorCreateArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TenantControlActors.
     * @param {TenantControlActorCreateManyArgs} args - Arguments to create many TenantControlActors.
     * @example
     * // Create many TenantControlActors
     * const tenantControlActor = await prisma.tenantControlActor.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TenantControlActorCreateManyArgs>(args?: SelectSubset<T, TenantControlActorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TenantControlActors and returns the data saved in the database.
     * @param {TenantControlActorCreateManyAndReturnArgs} args - Arguments to create many TenantControlActors.
     * @example
     * // Create many TenantControlActors
     * const tenantControlActor = await prisma.tenantControlActor.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TenantControlActors and only return the `id`
     * const tenantControlActorWithIdOnly = await prisma.tenantControlActor.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TenantControlActorCreateManyAndReturnArgs>(args?: SelectSubset<T, TenantControlActorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TenantControlActor.
     * @param {TenantControlActorDeleteArgs} args - Arguments to delete one TenantControlActor.
     * @example
     * // Delete one TenantControlActor
     * const TenantControlActor = await prisma.tenantControlActor.delete({
     *   where: {
     *     // ... filter to delete one TenantControlActor
     *   }
     * })
     * 
     */
    delete<T extends TenantControlActorDeleteArgs>(args: SelectSubset<T, TenantControlActorDeleteArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TenantControlActor.
     * @param {TenantControlActorUpdateArgs} args - Arguments to update one TenantControlActor.
     * @example
     * // Update one TenantControlActor
     * const tenantControlActor = await prisma.tenantControlActor.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TenantControlActorUpdateArgs>(args: SelectSubset<T, TenantControlActorUpdateArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TenantControlActors.
     * @param {TenantControlActorDeleteManyArgs} args - Arguments to filter TenantControlActors to delete.
     * @example
     * // Delete a few TenantControlActors
     * const { count } = await prisma.tenantControlActor.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TenantControlActorDeleteManyArgs>(args?: SelectSubset<T, TenantControlActorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TenantControlActors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TenantControlActors
     * const tenantControlActor = await prisma.tenantControlActor.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TenantControlActorUpdateManyArgs>(args: SelectSubset<T, TenantControlActorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TenantControlActors and returns the data updated in the database.
     * @param {TenantControlActorUpdateManyAndReturnArgs} args - Arguments to update many TenantControlActors.
     * @example
     * // Update many TenantControlActors
     * const tenantControlActor = await prisma.tenantControlActor.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TenantControlActors and only return the `id`
     * const tenantControlActorWithIdOnly = await prisma.tenantControlActor.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TenantControlActorUpdateManyAndReturnArgs>(args: SelectSubset<T, TenantControlActorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TenantControlActor.
     * @param {TenantControlActorUpsertArgs} args - Arguments to update or create a TenantControlActor.
     * @example
     * // Update or create a TenantControlActor
     * const tenantControlActor = await prisma.tenantControlActor.upsert({
     *   create: {
     *     // ... data to create a TenantControlActor
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TenantControlActor we want to update
     *   }
     * })
     */
    upsert<T extends TenantControlActorUpsertArgs>(args: SelectSubset<T, TenantControlActorUpsertArgs<ExtArgs>>): Prisma__TenantControlActorClient<$Result.GetResult<Prisma.$TenantControlActorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TenantControlActors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorCountArgs} args - Arguments to filter TenantControlActors to count.
     * @example
     * // Count the number of TenantControlActors
     * const count = await prisma.tenantControlActor.count({
     *   where: {
     *     // ... the filter for the TenantControlActors we want to count
     *   }
     * })
    **/
    count<T extends TenantControlActorCountArgs>(
      args?: Subset<T, TenantControlActorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TenantControlActorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TenantControlActor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TenantControlActorAggregateArgs>(args: Subset<T, TenantControlActorAggregateArgs>): Prisma.PrismaPromise<GetTenantControlActorAggregateType<T>>

    /**
     * Group by TenantControlActor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantControlActorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TenantControlActorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TenantControlActorGroupByArgs['orderBy'] }
        : { orderBy?: TenantControlActorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TenantControlActorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantControlActorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TenantControlActor model
   */
  readonly fields: TenantControlActorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TenantControlActor.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TenantControlActorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TenantControlActor model
   */
  interface TenantControlActorFieldRefs {
    readonly id: FieldRef<"TenantControlActor", 'String'>
    readonly tenantId: FieldRef<"TenantControlActor", 'String'>
    readonly actorId: FieldRef<"TenantControlActor", 'String'>
    readonly displayName: FieldRef<"TenantControlActor", 'String'>
    readonly email: FieldRef<"TenantControlActor", 'String'>
    readonly role: FieldRef<"TenantControlActor", 'String'>
    readonly permissionsJson: FieldRef<"TenantControlActor", 'String'>
    readonly supportSessionActive: FieldRef<"TenantControlActor", 'Boolean'>
    readonly supportSessionStartedAt: FieldRef<"TenantControlActor", 'DateTime'>
    readonly supportSessionExpiresAt: FieldRef<"TenantControlActor", 'DateTime'>
    readonly createdAt: FieldRef<"TenantControlActor", 'DateTime'>
    readonly updatedAt: FieldRef<"TenantControlActor", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TenantControlActor findUnique
   */
  export type TenantControlActorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlActor to fetch.
     */
    where: TenantControlActorWhereUniqueInput
  }

  /**
   * TenantControlActor findUniqueOrThrow
   */
  export type TenantControlActorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlActor to fetch.
     */
    where: TenantControlActorWhereUniqueInput
  }

  /**
   * TenantControlActor findFirst
   */
  export type TenantControlActorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlActor to fetch.
     */
    where?: TenantControlActorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlActors to fetch.
     */
    orderBy?: TenantControlActorOrderByWithRelationInput | TenantControlActorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TenantControlActors.
     */
    cursor?: TenantControlActorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlActors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlActors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TenantControlActors.
     */
    distinct?: TenantControlActorScalarFieldEnum | TenantControlActorScalarFieldEnum[]
  }

  /**
   * TenantControlActor findFirstOrThrow
   */
  export type TenantControlActorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlActor to fetch.
     */
    where?: TenantControlActorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlActors to fetch.
     */
    orderBy?: TenantControlActorOrderByWithRelationInput | TenantControlActorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TenantControlActors.
     */
    cursor?: TenantControlActorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlActors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlActors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TenantControlActors.
     */
    distinct?: TenantControlActorScalarFieldEnum | TenantControlActorScalarFieldEnum[]
  }

  /**
   * TenantControlActor findMany
   */
  export type TenantControlActorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * Filter, which TenantControlActors to fetch.
     */
    where?: TenantControlActorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TenantControlActors to fetch.
     */
    orderBy?: TenantControlActorOrderByWithRelationInput | TenantControlActorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TenantControlActors.
     */
    cursor?: TenantControlActorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TenantControlActors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TenantControlActors.
     */
    skip?: number
    distinct?: TenantControlActorScalarFieldEnum | TenantControlActorScalarFieldEnum[]
  }

  /**
   * TenantControlActor create
   */
  export type TenantControlActorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * The data needed to create a TenantControlActor.
     */
    data: XOR<TenantControlActorCreateInput, TenantControlActorUncheckedCreateInput>
  }

  /**
   * TenantControlActor createMany
   */
  export type TenantControlActorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TenantControlActors.
     */
    data: TenantControlActorCreateManyInput | TenantControlActorCreateManyInput[]
  }

  /**
   * TenantControlActor createManyAndReturn
   */
  export type TenantControlActorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * The data used to create many TenantControlActors.
     */
    data: TenantControlActorCreateManyInput | TenantControlActorCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TenantControlActor update
   */
  export type TenantControlActorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * The data needed to update a TenantControlActor.
     */
    data: XOR<TenantControlActorUpdateInput, TenantControlActorUncheckedUpdateInput>
    /**
     * Choose, which TenantControlActor to update.
     */
    where: TenantControlActorWhereUniqueInput
  }

  /**
   * TenantControlActor updateMany
   */
  export type TenantControlActorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TenantControlActors.
     */
    data: XOR<TenantControlActorUpdateManyMutationInput, TenantControlActorUncheckedUpdateManyInput>
    /**
     * Filter which TenantControlActors to update
     */
    where?: TenantControlActorWhereInput
    /**
     * Limit how many TenantControlActors to update.
     */
    limit?: number
  }

  /**
   * TenantControlActor updateManyAndReturn
   */
  export type TenantControlActorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * The data used to update TenantControlActors.
     */
    data: XOR<TenantControlActorUpdateManyMutationInput, TenantControlActorUncheckedUpdateManyInput>
    /**
     * Filter which TenantControlActors to update
     */
    where?: TenantControlActorWhereInput
    /**
     * Limit how many TenantControlActors to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TenantControlActor upsert
   */
  export type TenantControlActorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * The filter to search for the TenantControlActor to update in case it exists.
     */
    where: TenantControlActorWhereUniqueInput
    /**
     * In case the TenantControlActor found by the `where` argument doesn't exist, create a new TenantControlActor with this data.
     */
    create: XOR<TenantControlActorCreateInput, TenantControlActorUncheckedCreateInput>
    /**
     * In case the TenantControlActor was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TenantControlActorUpdateInput, TenantControlActorUncheckedUpdateInput>
  }

  /**
   * TenantControlActor delete
   */
  export type TenantControlActorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
    /**
     * Filter which TenantControlActor to delete.
     */
    where: TenantControlActorWhereUniqueInput
  }

  /**
   * TenantControlActor deleteMany
   */
  export type TenantControlActorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TenantControlActors to delete
     */
    where?: TenantControlActorWhereInput
    /**
     * Limit how many TenantControlActors to delete.
     */
    limit?: number
  }

  /**
   * TenantControlActor without action
   */
  export type TenantControlActorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantControlActor
     */
    select?: TenantControlActorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TenantControlActor
     */
    omit?: TenantControlActorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TenantControlActorInclude<ExtArgs> | null
  }


  /**
   * Model ModuleConfig
   */

  export type AggregateModuleConfig = {
    _count: ModuleConfigCountAggregateOutputType | null
    _avg: ModuleConfigAvgAggregateOutputType | null
    _sum: ModuleConfigSumAggregateOutputType | null
    _min: ModuleConfigMinAggregateOutputType | null
    _max: ModuleConfigMaxAggregateOutputType | null
  }

  export type ModuleConfigAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type ModuleConfigSumAggregateOutputType = {
    sortOrder: number | null
  }

  export type ModuleConfigMinAggregateOutputType = {
    id: string | null
    websiteConfigId: string | null
    tenantId: string | null
    moduleKey: string | null
    enabled: boolean | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModuleConfigMaxAggregateOutputType = {
    id: string | null
    websiteConfigId: string | null
    tenantId: string | null
    moduleKey: string | null
    enabled: boolean | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModuleConfigCountAggregateOutputType = {
    id: number
    websiteConfigId: number
    tenantId: number
    moduleKey: number
    enabled: number
    sortOrder: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ModuleConfigAvgAggregateInputType = {
    sortOrder?: true
  }

  export type ModuleConfigSumAggregateInputType = {
    sortOrder?: true
  }

  export type ModuleConfigMinAggregateInputType = {
    id?: true
    websiteConfigId?: true
    tenantId?: true
    moduleKey?: true
    enabled?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModuleConfigMaxAggregateInputType = {
    id?: true
    websiteConfigId?: true
    tenantId?: true
    moduleKey?: true
    enabled?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModuleConfigCountAggregateInputType = {
    id?: true
    websiteConfigId?: true
    tenantId?: true
    moduleKey?: true
    enabled?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ModuleConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModuleConfig to aggregate.
     */
    where?: ModuleConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModuleConfigs to fetch.
     */
    orderBy?: ModuleConfigOrderByWithRelationInput | ModuleConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModuleConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModuleConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModuleConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModuleConfigs
    **/
    _count?: true | ModuleConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ModuleConfigAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ModuleConfigSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModuleConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModuleConfigMaxAggregateInputType
  }

  export type GetModuleConfigAggregateType<T extends ModuleConfigAggregateArgs> = {
        [P in keyof T & keyof AggregateModuleConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModuleConfig[P]>
      : GetScalarType<T[P], AggregateModuleConfig[P]>
  }




  export type ModuleConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModuleConfigWhereInput
    orderBy?: ModuleConfigOrderByWithAggregationInput | ModuleConfigOrderByWithAggregationInput[]
    by: ModuleConfigScalarFieldEnum[] | ModuleConfigScalarFieldEnum
    having?: ModuleConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModuleConfigCountAggregateInputType | true
    _avg?: ModuleConfigAvgAggregateInputType
    _sum?: ModuleConfigSumAggregateInputType
    _min?: ModuleConfigMinAggregateInputType
    _max?: ModuleConfigMaxAggregateInputType
  }

  export type ModuleConfigGroupByOutputType = {
    id: string
    websiteConfigId: string
    tenantId: string
    moduleKey: string
    enabled: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    _count: ModuleConfigCountAggregateOutputType | null
    _avg: ModuleConfigAvgAggregateOutputType | null
    _sum: ModuleConfigSumAggregateOutputType | null
    _min: ModuleConfigMinAggregateOutputType | null
    _max: ModuleConfigMaxAggregateOutputType | null
  }

  type GetModuleConfigGroupByPayload<T extends ModuleConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModuleConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModuleConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModuleConfigGroupByOutputType[P]>
            : GetScalarType<T[P], ModuleConfigGroupByOutputType[P]>
        }
      >
    >


  export type ModuleConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    websiteConfigId?: boolean
    tenantId?: boolean
    moduleKey?: boolean
    enabled?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    websiteConfig?: boolean | WebsiteConfigDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["moduleConfig"]>

  export type ModuleConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    websiteConfigId?: boolean
    tenantId?: boolean
    moduleKey?: boolean
    enabled?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    websiteConfig?: boolean | WebsiteConfigDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["moduleConfig"]>

  export type ModuleConfigSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    websiteConfigId?: boolean
    tenantId?: boolean
    moduleKey?: boolean
    enabled?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    websiteConfig?: boolean | WebsiteConfigDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["moduleConfig"]>

  export type ModuleConfigSelectScalar = {
    id?: boolean
    websiteConfigId?: boolean
    tenantId?: boolean
    moduleKey?: boolean
    enabled?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ModuleConfigOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "websiteConfigId" | "tenantId" | "moduleKey" | "enabled" | "sortOrder" | "createdAt" | "updatedAt", ExtArgs["result"]["moduleConfig"]>
  export type ModuleConfigInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    websiteConfig?: boolean | WebsiteConfigDefaultArgs<ExtArgs>
  }
  export type ModuleConfigIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    websiteConfig?: boolean | WebsiteConfigDefaultArgs<ExtArgs>
  }
  export type ModuleConfigIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    websiteConfig?: boolean | WebsiteConfigDefaultArgs<ExtArgs>
  }

  export type $ModuleConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModuleConfig"
    objects: {
      websiteConfig: Prisma.$WebsiteConfigPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      websiteConfigId: string
      tenantId: string
      moduleKey: string
      enabled: boolean
      sortOrder: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["moduleConfig"]>
    composites: {}
  }

  type ModuleConfigGetPayload<S extends boolean | null | undefined | ModuleConfigDefaultArgs> = $Result.GetResult<Prisma.$ModuleConfigPayload, S>

  type ModuleConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModuleConfigFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModuleConfigCountAggregateInputType | true
    }

  export interface ModuleConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModuleConfig'], meta: { name: 'ModuleConfig' } }
    /**
     * Find zero or one ModuleConfig that matches the filter.
     * @param {ModuleConfigFindUniqueArgs} args - Arguments to find a ModuleConfig
     * @example
     * // Get one ModuleConfig
     * const moduleConfig = await prisma.moduleConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModuleConfigFindUniqueArgs>(args: SelectSubset<T, ModuleConfigFindUniqueArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModuleConfig that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModuleConfigFindUniqueOrThrowArgs} args - Arguments to find a ModuleConfig
     * @example
     * // Get one ModuleConfig
     * const moduleConfig = await prisma.moduleConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModuleConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, ModuleConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModuleConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigFindFirstArgs} args - Arguments to find a ModuleConfig
     * @example
     * // Get one ModuleConfig
     * const moduleConfig = await prisma.moduleConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModuleConfigFindFirstArgs>(args?: SelectSubset<T, ModuleConfigFindFirstArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModuleConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigFindFirstOrThrowArgs} args - Arguments to find a ModuleConfig
     * @example
     * // Get one ModuleConfig
     * const moduleConfig = await prisma.moduleConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModuleConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, ModuleConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModuleConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModuleConfigs
     * const moduleConfigs = await prisma.moduleConfig.findMany()
     * 
     * // Get first 10 ModuleConfigs
     * const moduleConfigs = await prisma.moduleConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const moduleConfigWithIdOnly = await prisma.moduleConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModuleConfigFindManyArgs>(args?: SelectSubset<T, ModuleConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModuleConfig.
     * @param {ModuleConfigCreateArgs} args - Arguments to create a ModuleConfig.
     * @example
     * // Create one ModuleConfig
     * const ModuleConfig = await prisma.moduleConfig.create({
     *   data: {
     *     // ... data to create a ModuleConfig
     *   }
     * })
     * 
     */
    create<T extends ModuleConfigCreateArgs>(args: SelectSubset<T, ModuleConfigCreateArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModuleConfigs.
     * @param {ModuleConfigCreateManyArgs} args - Arguments to create many ModuleConfigs.
     * @example
     * // Create many ModuleConfigs
     * const moduleConfig = await prisma.moduleConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModuleConfigCreateManyArgs>(args?: SelectSubset<T, ModuleConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModuleConfigs and returns the data saved in the database.
     * @param {ModuleConfigCreateManyAndReturnArgs} args - Arguments to create many ModuleConfigs.
     * @example
     * // Create many ModuleConfigs
     * const moduleConfig = await prisma.moduleConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModuleConfigs and only return the `id`
     * const moduleConfigWithIdOnly = await prisma.moduleConfig.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModuleConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, ModuleConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModuleConfig.
     * @param {ModuleConfigDeleteArgs} args - Arguments to delete one ModuleConfig.
     * @example
     * // Delete one ModuleConfig
     * const ModuleConfig = await prisma.moduleConfig.delete({
     *   where: {
     *     // ... filter to delete one ModuleConfig
     *   }
     * })
     * 
     */
    delete<T extends ModuleConfigDeleteArgs>(args: SelectSubset<T, ModuleConfigDeleteArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModuleConfig.
     * @param {ModuleConfigUpdateArgs} args - Arguments to update one ModuleConfig.
     * @example
     * // Update one ModuleConfig
     * const moduleConfig = await prisma.moduleConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModuleConfigUpdateArgs>(args: SelectSubset<T, ModuleConfigUpdateArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModuleConfigs.
     * @param {ModuleConfigDeleteManyArgs} args - Arguments to filter ModuleConfigs to delete.
     * @example
     * // Delete a few ModuleConfigs
     * const { count } = await prisma.moduleConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModuleConfigDeleteManyArgs>(args?: SelectSubset<T, ModuleConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModuleConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModuleConfigs
     * const moduleConfig = await prisma.moduleConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModuleConfigUpdateManyArgs>(args: SelectSubset<T, ModuleConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModuleConfigs and returns the data updated in the database.
     * @param {ModuleConfigUpdateManyAndReturnArgs} args - Arguments to update many ModuleConfigs.
     * @example
     * // Update many ModuleConfigs
     * const moduleConfig = await prisma.moduleConfig.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModuleConfigs and only return the `id`
     * const moduleConfigWithIdOnly = await prisma.moduleConfig.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModuleConfigUpdateManyAndReturnArgs>(args: SelectSubset<T, ModuleConfigUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModuleConfig.
     * @param {ModuleConfigUpsertArgs} args - Arguments to update or create a ModuleConfig.
     * @example
     * // Update or create a ModuleConfig
     * const moduleConfig = await prisma.moduleConfig.upsert({
     *   create: {
     *     // ... data to create a ModuleConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModuleConfig we want to update
     *   }
     * })
     */
    upsert<T extends ModuleConfigUpsertArgs>(args: SelectSubset<T, ModuleConfigUpsertArgs<ExtArgs>>): Prisma__ModuleConfigClient<$Result.GetResult<Prisma.$ModuleConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModuleConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigCountArgs} args - Arguments to filter ModuleConfigs to count.
     * @example
     * // Count the number of ModuleConfigs
     * const count = await prisma.moduleConfig.count({
     *   where: {
     *     // ... the filter for the ModuleConfigs we want to count
     *   }
     * })
    **/
    count<T extends ModuleConfigCountArgs>(
      args?: Subset<T, ModuleConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModuleConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModuleConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModuleConfigAggregateArgs>(args: Subset<T, ModuleConfigAggregateArgs>): Prisma.PrismaPromise<GetModuleConfigAggregateType<T>>

    /**
     * Group by ModuleConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModuleConfigGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModuleConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModuleConfigGroupByArgs['orderBy'] }
        : { orderBy?: ModuleConfigGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModuleConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModuleConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModuleConfig model
   */
  readonly fields: ModuleConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModuleConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModuleConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    websiteConfig<T extends WebsiteConfigDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WebsiteConfigDefaultArgs<ExtArgs>>): Prisma__WebsiteConfigClient<$Result.GetResult<Prisma.$WebsiteConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModuleConfig model
   */
  interface ModuleConfigFieldRefs {
    readonly id: FieldRef<"ModuleConfig", 'String'>
    readonly websiteConfigId: FieldRef<"ModuleConfig", 'String'>
    readonly tenantId: FieldRef<"ModuleConfig", 'String'>
    readonly moduleKey: FieldRef<"ModuleConfig", 'String'>
    readonly enabled: FieldRef<"ModuleConfig", 'Boolean'>
    readonly sortOrder: FieldRef<"ModuleConfig", 'Int'>
    readonly createdAt: FieldRef<"ModuleConfig", 'DateTime'>
    readonly updatedAt: FieldRef<"ModuleConfig", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModuleConfig findUnique
   */
  export type ModuleConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * Filter, which ModuleConfig to fetch.
     */
    where: ModuleConfigWhereUniqueInput
  }

  /**
   * ModuleConfig findUniqueOrThrow
   */
  export type ModuleConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * Filter, which ModuleConfig to fetch.
     */
    where: ModuleConfigWhereUniqueInput
  }

  /**
   * ModuleConfig findFirst
   */
  export type ModuleConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * Filter, which ModuleConfig to fetch.
     */
    where?: ModuleConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModuleConfigs to fetch.
     */
    orderBy?: ModuleConfigOrderByWithRelationInput | ModuleConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModuleConfigs.
     */
    cursor?: ModuleConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModuleConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModuleConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModuleConfigs.
     */
    distinct?: ModuleConfigScalarFieldEnum | ModuleConfigScalarFieldEnum[]
  }

  /**
   * ModuleConfig findFirstOrThrow
   */
  export type ModuleConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * Filter, which ModuleConfig to fetch.
     */
    where?: ModuleConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModuleConfigs to fetch.
     */
    orderBy?: ModuleConfigOrderByWithRelationInput | ModuleConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModuleConfigs.
     */
    cursor?: ModuleConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModuleConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModuleConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModuleConfigs.
     */
    distinct?: ModuleConfigScalarFieldEnum | ModuleConfigScalarFieldEnum[]
  }

  /**
   * ModuleConfig findMany
   */
  export type ModuleConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * Filter, which ModuleConfigs to fetch.
     */
    where?: ModuleConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModuleConfigs to fetch.
     */
    orderBy?: ModuleConfigOrderByWithRelationInput | ModuleConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModuleConfigs.
     */
    cursor?: ModuleConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModuleConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModuleConfigs.
     */
    skip?: number
    distinct?: ModuleConfigScalarFieldEnum | ModuleConfigScalarFieldEnum[]
  }

  /**
   * ModuleConfig create
   */
  export type ModuleConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * The data needed to create a ModuleConfig.
     */
    data: XOR<ModuleConfigCreateInput, ModuleConfigUncheckedCreateInput>
  }

  /**
   * ModuleConfig createMany
   */
  export type ModuleConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModuleConfigs.
     */
    data: ModuleConfigCreateManyInput | ModuleConfigCreateManyInput[]
  }

  /**
   * ModuleConfig createManyAndReturn
   */
  export type ModuleConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * The data used to create many ModuleConfigs.
     */
    data: ModuleConfigCreateManyInput | ModuleConfigCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModuleConfig update
   */
  export type ModuleConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * The data needed to update a ModuleConfig.
     */
    data: XOR<ModuleConfigUpdateInput, ModuleConfigUncheckedUpdateInput>
    /**
     * Choose, which ModuleConfig to update.
     */
    where: ModuleConfigWhereUniqueInput
  }

  /**
   * ModuleConfig updateMany
   */
  export type ModuleConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModuleConfigs.
     */
    data: XOR<ModuleConfigUpdateManyMutationInput, ModuleConfigUncheckedUpdateManyInput>
    /**
     * Filter which ModuleConfigs to update
     */
    where?: ModuleConfigWhereInput
    /**
     * Limit how many ModuleConfigs to update.
     */
    limit?: number
  }

  /**
   * ModuleConfig updateManyAndReturn
   */
  export type ModuleConfigUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * The data used to update ModuleConfigs.
     */
    data: XOR<ModuleConfigUpdateManyMutationInput, ModuleConfigUncheckedUpdateManyInput>
    /**
     * Filter which ModuleConfigs to update
     */
    where?: ModuleConfigWhereInput
    /**
     * Limit how many ModuleConfigs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModuleConfig upsert
   */
  export type ModuleConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * The filter to search for the ModuleConfig to update in case it exists.
     */
    where: ModuleConfigWhereUniqueInput
    /**
     * In case the ModuleConfig found by the `where` argument doesn't exist, create a new ModuleConfig with this data.
     */
    create: XOR<ModuleConfigCreateInput, ModuleConfigUncheckedCreateInput>
    /**
     * In case the ModuleConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModuleConfigUpdateInput, ModuleConfigUncheckedUpdateInput>
  }

  /**
   * ModuleConfig delete
   */
  export type ModuleConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
    /**
     * Filter which ModuleConfig to delete.
     */
    where: ModuleConfigWhereUniqueInput
  }

  /**
   * ModuleConfig deleteMany
   */
  export type ModuleConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModuleConfigs to delete
     */
    where?: ModuleConfigWhereInput
    /**
     * Limit how many ModuleConfigs to delete.
     */
    limit?: number
  }

  /**
   * ModuleConfig without action
   */
  export type ModuleConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModuleConfig
     */
    select?: ModuleConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModuleConfig
     */
    omit?: ModuleConfigOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModuleConfigInclude<ExtArgs> | null
  }


  /**
   * Model Contact
   */

  export type AggregateContact = {
    _count: ContactCountAggregateOutputType | null
    _min: ContactMinAggregateOutputType | null
    _max: ContactMaxAggregateOutputType | null
  }

  export type ContactMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    fullName: string | null
    email: string | null
    emailNormalized: string | null
    phone: string | null
    phoneNormalized: string | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContactMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    fullName: string | null
    email: string | null
    emailNormalized: string | null
    phone: string | null
    phoneNormalized: string | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContactCountAggregateOutputType = {
    id: number
    tenantId: number
    fullName: number
    email: number
    emailNormalized: number
    phone: number
    phoneNormalized: number
    source: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContactMinAggregateInputType = {
    id?: true
    tenantId?: true
    fullName?: true
    email?: true
    emailNormalized?: true
    phone?: true
    phoneNormalized?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContactMaxAggregateInputType = {
    id?: true
    tenantId?: true
    fullName?: true
    email?: true
    emailNormalized?: true
    phone?: true
    phoneNormalized?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContactCountAggregateInputType = {
    id?: true
    tenantId?: true
    fullName?: true
    email?: true
    emailNormalized?: true
    phone?: true
    phoneNormalized?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContactAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contact to aggregate.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Contacts
    **/
    _count?: true | ContactCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContactMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContactMaxAggregateInputType
  }

  export type GetContactAggregateType<T extends ContactAggregateArgs> = {
        [P in keyof T & keyof AggregateContact]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContact[P]>
      : GetScalarType<T[P], AggregateContact[P]>
  }




  export type ContactGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactWhereInput
    orderBy?: ContactOrderByWithAggregationInput | ContactOrderByWithAggregationInput[]
    by: ContactScalarFieldEnum[] | ContactScalarFieldEnum
    having?: ContactScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContactCountAggregateInputType | true
    _min?: ContactMinAggregateInputType
    _max?: ContactMaxAggregateInputType
  }

  export type ContactGroupByOutputType = {
    id: string
    tenantId: string
    fullName: string | null
    email: string | null
    emailNormalized: string | null
    phone: string | null
    phoneNormalized: string | null
    source: string
    createdAt: Date
    updatedAt: Date
    _count: ContactCountAggregateOutputType | null
    _min: ContactMinAggregateOutputType | null
    _max: ContactMaxAggregateOutputType | null
  }

  type GetContactGroupByPayload<T extends ContactGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContactGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContactGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContactGroupByOutputType[P]>
            : GetScalarType<T[P], ContactGroupByOutputType[P]>
        }
      >
    >


  export type ContactSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    fullName?: boolean
    email?: boolean
    emailNormalized?: boolean
    phone?: boolean
    phoneNormalized?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    leads?: boolean | Contact$leadsArgs<ExtArgs>
    activities?: boolean | Contact$activitiesArgs<ExtArgs>
    _count?: boolean | ContactCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    fullName?: boolean
    email?: boolean
    emailNormalized?: boolean
    phone?: boolean
    phoneNormalized?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    fullName?: boolean
    email?: boolean
    emailNormalized?: boolean
    phone?: boolean
    phoneNormalized?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectScalar = {
    id?: boolean
    tenantId?: boolean
    fullName?: boolean
    email?: boolean
    emailNormalized?: boolean
    phone?: boolean
    phoneNormalized?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ContactOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "fullName" | "email" | "emailNormalized" | "phone" | "phoneNormalized" | "source" | "createdAt" | "updatedAt", ExtArgs["result"]["contact"]>
  export type ContactInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    leads?: boolean | Contact$leadsArgs<ExtArgs>
    activities?: boolean | Contact$activitiesArgs<ExtArgs>
    _count?: boolean | ContactCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ContactIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type ContactIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $ContactPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Contact"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
      leads: Prisma.$LeadPayload<ExtArgs>[]
      activities: Prisma.$ActivityPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      fullName: string | null
      email: string | null
      emailNormalized: string | null
      phone: string | null
      phoneNormalized: string | null
      source: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contact"]>
    composites: {}
  }

  type ContactGetPayload<S extends boolean | null | undefined | ContactDefaultArgs> = $Result.GetResult<Prisma.$ContactPayload, S>

  type ContactCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContactFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContactCountAggregateInputType | true
    }

  export interface ContactDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Contact'], meta: { name: 'Contact' } }
    /**
     * Find zero or one Contact that matches the filter.
     * @param {ContactFindUniqueArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContactFindUniqueArgs>(args: SelectSubset<T, ContactFindUniqueArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Contact that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContactFindUniqueOrThrowArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContactFindUniqueOrThrowArgs>(args: SelectSubset<T, ContactFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Contact that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindFirstArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContactFindFirstArgs>(args?: SelectSubset<T, ContactFindFirstArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Contact that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindFirstOrThrowArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContactFindFirstOrThrowArgs>(args?: SelectSubset<T, ContactFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Contacts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Contacts
     * const contacts = await prisma.contact.findMany()
     * 
     * // Get first 10 Contacts
     * const contacts = await prisma.contact.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contactWithIdOnly = await prisma.contact.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContactFindManyArgs>(args?: SelectSubset<T, ContactFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Contact.
     * @param {ContactCreateArgs} args - Arguments to create a Contact.
     * @example
     * // Create one Contact
     * const Contact = await prisma.contact.create({
     *   data: {
     *     // ... data to create a Contact
     *   }
     * })
     * 
     */
    create<T extends ContactCreateArgs>(args: SelectSubset<T, ContactCreateArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Contacts.
     * @param {ContactCreateManyArgs} args - Arguments to create many Contacts.
     * @example
     * // Create many Contacts
     * const contact = await prisma.contact.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContactCreateManyArgs>(args?: SelectSubset<T, ContactCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Contacts and returns the data saved in the database.
     * @param {ContactCreateManyAndReturnArgs} args - Arguments to create many Contacts.
     * @example
     * // Create many Contacts
     * const contact = await prisma.contact.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Contacts and only return the `id`
     * const contactWithIdOnly = await prisma.contact.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContactCreateManyAndReturnArgs>(args?: SelectSubset<T, ContactCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Contact.
     * @param {ContactDeleteArgs} args - Arguments to delete one Contact.
     * @example
     * // Delete one Contact
     * const Contact = await prisma.contact.delete({
     *   where: {
     *     // ... filter to delete one Contact
     *   }
     * })
     * 
     */
    delete<T extends ContactDeleteArgs>(args: SelectSubset<T, ContactDeleteArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Contact.
     * @param {ContactUpdateArgs} args - Arguments to update one Contact.
     * @example
     * // Update one Contact
     * const contact = await prisma.contact.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContactUpdateArgs>(args: SelectSubset<T, ContactUpdateArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Contacts.
     * @param {ContactDeleteManyArgs} args - Arguments to filter Contacts to delete.
     * @example
     * // Delete a few Contacts
     * const { count } = await prisma.contact.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContactDeleteManyArgs>(args?: SelectSubset<T, ContactDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Contacts
     * const contact = await prisma.contact.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContactUpdateManyArgs>(args: SelectSubset<T, ContactUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contacts and returns the data updated in the database.
     * @param {ContactUpdateManyAndReturnArgs} args - Arguments to update many Contacts.
     * @example
     * // Update many Contacts
     * const contact = await prisma.contact.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Contacts and only return the `id`
     * const contactWithIdOnly = await prisma.contact.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ContactUpdateManyAndReturnArgs>(args: SelectSubset<T, ContactUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Contact.
     * @param {ContactUpsertArgs} args - Arguments to update or create a Contact.
     * @example
     * // Update or create a Contact
     * const contact = await prisma.contact.upsert({
     *   create: {
     *     // ... data to create a Contact
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Contact we want to update
     *   }
     * })
     */
    upsert<T extends ContactUpsertArgs>(args: SelectSubset<T, ContactUpsertArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Contacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactCountArgs} args - Arguments to filter Contacts to count.
     * @example
     * // Count the number of Contacts
     * const count = await prisma.contact.count({
     *   where: {
     *     // ... the filter for the Contacts we want to count
     *   }
     * })
    **/
    count<T extends ContactCountArgs>(
      args?: Subset<T, ContactCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContactCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Contact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContactAggregateArgs>(args: Subset<T, ContactAggregateArgs>): Prisma.PrismaPromise<GetContactAggregateType<T>>

    /**
     * Group by Contact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ContactGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContactGroupByArgs['orderBy'] }
        : { orderBy?: ContactGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ContactGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContactGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Contact model
   */
  readonly fields: ContactFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Contact.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContactClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    leads<T extends Contact$leadsArgs<ExtArgs> = {}>(args?: Subset<T, Contact$leadsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    activities<T extends Contact$activitiesArgs<ExtArgs> = {}>(args?: Subset<T, Contact$activitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Contact model
   */
  interface ContactFieldRefs {
    readonly id: FieldRef<"Contact", 'String'>
    readonly tenantId: FieldRef<"Contact", 'String'>
    readonly fullName: FieldRef<"Contact", 'String'>
    readonly email: FieldRef<"Contact", 'String'>
    readonly emailNormalized: FieldRef<"Contact", 'String'>
    readonly phone: FieldRef<"Contact", 'String'>
    readonly phoneNormalized: FieldRef<"Contact", 'String'>
    readonly source: FieldRef<"Contact", 'String'>
    readonly createdAt: FieldRef<"Contact", 'DateTime'>
    readonly updatedAt: FieldRef<"Contact", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Contact findUnique
   */
  export type ContactFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact findUniqueOrThrow
   */
  export type ContactFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact findFirst
   */
  export type ContactFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contacts.
     */
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact findFirstOrThrow
   */
  export type ContactFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contacts.
     */
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact findMany
   */
  export type ContactFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contacts to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact create
   */
  export type ContactCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The data needed to create a Contact.
     */
    data: XOR<ContactCreateInput, ContactUncheckedCreateInput>
  }

  /**
   * Contact createMany
   */
  export type ContactCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Contacts.
     */
    data: ContactCreateManyInput | ContactCreateManyInput[]
  }

  /**
   * Contact createManyAndReturn
   */
  export type ContactCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * The data used to create many Contacts.
     */
    data: ContactCreateManyInput | ContactCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Contact update
   */
  export type ContactUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The data needed to update a Contact.
     */
    data: XOR<ContactUpdateInput, ContactUncheckedUpdateInput>
    /**
     * Choose, which Contact to update.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact updateMany
   */
  export type ContactUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Contacts.
     */
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyInput>
    /**
     * Filter which Contacts to update
     */
    where?: ContactWhereInput
    /**
     * Limit how many Contacts to update.
     */
    limit?: number
  }

  /**
   * Contact updateManyAndReturn
   */
  export type ContactUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * The data used to update Contacts.
     */
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyInput>
    /**
     * Filter which Contacts to update
     */
    where?: ContactWhereInput
    /**
     * Limit how many Contacts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Contact upsert
   */
  export type ContactUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The filter to search for the Contact to update in case it exists.
     */
    where: ContactWhereUniqueInput
    /**
     * In case the Contact found by the `where` argument doesn't exist, create a new Contact with this data.
     */
    create: XOR<ContactCreateInput, ContactUncheckedCreateInput>
    /**
     * In case the Contact was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContactUpdateInput, ContactUncheckedUpdateInput>
  }

  /**
   * Contact delete
   */
  export type ContactDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter which Contact to delete.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact deleteMany
   */
  export type ContactDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contacts to delete
     */
    where?: ContactWhereInput
    /**
     * Limit how many Contacts to delete.
     */
    limit?: number
  }

  /**
   * Contact.leads
   */
  export type Contact$leadsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    where?: LeadWhereInput
    orderBy?: LeadOrderByWithRelationInput | LeadOrderByWithRelationInput[]
    cursor?: LeadWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LeadScalarFieldEnum | LeadScalarFieldEnum[]
  }

  /**
   * Contact.activities
   */
  export type Contact$activitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    where?: ActivityWhereInput
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    cursor?: ActivityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Contact without action
   */
  export type ContactDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
  }


  /**
   * Model Lead
   */

  export type AggregateLead = {
    _count: LeadCountAggregateOutputType | null
    _avg: LeadAvgAggregateOutputType | null
    _sum: LeadSumAggregateOutputType | null
    _min: LeadMinAggregateOutputType | null
    _max: LeadMaxAggregateOutputType | null
  }

  export type LeadAvgAggregateOutputType = {
    beds: number | null
    baths: number | null
    sqft: number | null
  }

  export type LeadSumAggregateOutputType = {
    beds: number | null
    baths: number | null
    sqft: number | null
  }

  export type LeadMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    contactId: string | null
    status: string | null
    leadType: string | null
    source: string | null
    timeframe: string | null
    notes: string | null
    listingId: string | null
    listingUrl: string | null
    listingAddress: string | null
    propertyType: string | null
    beds: number | null
    baths: number | null
    sqft: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LeadMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    contactId: string | null
    status: string | null
    leadType: string | null
    source: string | null
    timeframe: string | null
    notes: string | null
    listingId: string | null
    listingUrl: string | null
    listingAddress: string | null
    propertyType: string | null
    beds: number | null
    baths: number | null
    sqft: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LeadCountAggregateOutputType = {
    id: number
    tenantId: number
    contactId: number
    status: number
    leadType: number
    source: number
    timeframe: number
    notes: number
    listingId: number
    listingUrl: number
    listingAddress: number
    propertyType: number
    beds: number
    baths: number
    sqft: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LeadAvgAggregateInputType = {
    beds?: true
    baths?: true
    sqft?: true
  }

  export type LeadSumAggregateInputType = {
    beds?: true
    baths?: true
    sqft?: true
  }

  export type LeadMinAggregateInputType = {
    id?: true
    tenantId?: true
    contactId?: true
    status?: true
    leadType?: true
    source?: true
    timeframe?: true
    notes?: true
    listingId?: true
    listingUrl?: true
    listingAddress?: true
    propertyType?: true
    beds?: true
    baths?: true
    sqft?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LeadMaxAggregateInputType = {
    id?: true
    tenantId?: true
    contactId?: true
    status?: true
    leadType?: true
    source?: true
    timeframe?: true
    notes?: true
    listingId?: true
    listingUrl?: true
    listingAddress?: true
    propertyType?: true
    beds?: true
    baths?: true
    sqft?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LeadCountAggregateInputType = {
    id?: true
    tenantId?: true
    contactId?: true
    status?: true
    leadType?: true
    source?: true
    timeframe?: true
    notes?: true
    listingId?: true
    listingUrl?: true
    listingAddress?: true
    propertyType?: true
    beds?: true
    baths?: true
    sqft?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LeadAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Lead to aggregate.
     */
    where?: LeadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leads to fetch.
     */
    orderBy?: LeadOrderByWithRelationInput | LeadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LeadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Leads
    **/
    _count?: true | LeadCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LeadAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LeadSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LeadMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LeadMaxAggregateInputType
  }

  export type GetLeadAggregateType<T extends LeadAggregateArgs> = {
        [P in keyof T & keyof AggregateLead]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLead[P]>
      : GetScalarType<T[P], AggregateLead[P]>
  }




  export type LeadGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeadWhereInput
    orderBy?: LeadOrderByWithAggregationInput | LeadOrderByWithAggregationInput[]
    by: LeadScalarFieldEnum[] | LeadScalarFieldEnum
    having?: LeadScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LeadCountAggregateInputType | true
    _avg?: LeadAvgAggregateInputType
    _sum?: LeadSumAggregateInputType
    _min?: LeadMinAggregateInputType
    _max?: LeadMaxAggregateInputType
  }

  export type LeadGroupByOutputType = {
    id: string
    tenantId: string
    contactId: string | null
    status: string
    leadType: string
    source: string
    timeframe: string | null
    notes: string | null
    listingId: string | null
    listingUrl: string | null
    listingAddress: string | null
    propertyType: string | null
    beds: number | null
    baths: number | null
    sqft: number | null
    createdAt: Date
    updatedAt: Date
    _count: LeadCountAggregateOutputType | null
    _avg: LeadAvgAggregateOutputType | null
    _sum: LeadSumAggregateOutputType | null
    _min: LeadMinAggregateOutputType | null
    _max: LeadMaxAggregateOutputType | null
  }

  type GetLeadGroupByPayload<T extends LeadGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LeadGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LeadGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LeadGroupByOutputType[P]>
            : GetScalarType<T[P], LeadGroupByOutputType[P]>
        }
      >
    >


  export type LeadSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    status?: boolean
    leadType?: boolean
    source?: boolean
    timeframe?: boolean
    notes?: boolean
    listingId?: boolean
    listingUrl?: boolean
    listingAddress?: boolean
    propertyType?: boolean
    beds?: boolean
    baths?: boolean
    sqft?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Lead$contactArgs<ExtArgs>
    activities?: boolean | Lead$activitiesArgs<ExtArgs>
    _count?: boolean | LeadCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["lead"]>

  export type LeadSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    status?: boolean
    leadType?: boolean
    source?: boolean
    timeframe?: boolean
    notes?: boolean
    listingId?: boolean
    listingUrl?: boolean
    listingAddress?: boolean
    propertyType?: boolean
    beds?: boolean
    baths?: boolean
    sqft?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Lead$contactArgs<ExtArgs>
  }, ExtArgs["result"]["lead"]>

  export type LeadSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    status?: boolean
    leadType?: boolean
    source?: boolean
    timeframe?: boolean
    notes?: boolean
    listingId?: boolean
    listingUrl?: boolean
    listingAddress?: boolean
    propertyType?: boolean
    beds?: boolean
    baths?: boolean
    sqft?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Lead$contactArgs<ExtArgs>
  }, ExtArgs["result"]["lead"]>

  export type LeadSelectScalar = {
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    status?: boolean
    leadType?: boolean
    source?: boolean
    timeframe?: boolean
    notes?: boolean
    listingId?: boolean
    listingUrl?: boolean
    listingAddress?: boolean
    propertyType?: boolean
    beds?: boolean
    baths?: boolean
    sqft?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LeadOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "contactId" | "status" | "leadType" | "source" | "timeframe" | "notes" | "listingId" | "listingUrl" | "listingAddress" | "propertyType" | "beds" | "baths" | "sqft" | "createdAt" | "updatedAt", ExtArgs["result"]["lead"]>
  export type LeadInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Lead$contactArgs<ExtArgs>
    activities?: boolean | Lead$activitiesArgs<ExtArgs>
    _count?: boolean | LeadCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LeadIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Lead$contactArgs<ExtArgs>
  }
  export type LeadIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Lead$contactArgs<ExtArgs>
  }

  export type $LeadPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Lead"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
      contact: Prisma.$ContactPayload<ExtArgs> | null
      activities: Prisma.$ActivityPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      contactId: string | null
      status: string
      leadType: string
      source: string
      timeframe: string | null
      notes: string | null
      listingId: string | null
      listingUrl: string | null
      listingAddress: string | null
      propertyType: string | null
      beds: number | null
      baths: number | null
      sqft: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["lead"]>
    composites: {}
  }

  type LeadGetPayload<S extends boolean | null | undefined | LeadDefaultArgs> = $Result.GetResult<Prisma.$LeadPayload, S>

  type LeadCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LeadFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LeadCountAggregateInputType | true
    }

  export interface LeadDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Lead'], meta: { name: 'Lead' } }
    /**
     * Find zero or one Lead that matches the filter.
     * @param {LeadFindUniqueArgs} args - Arguments to find a Lead
     * @example
     * // Get one Lead
     * const lead = await prisma.lead.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LeadFindUniqueArgs>(args: SelectSubset<T, LeadFindUniqueArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Lead that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LeadFindUniqueOrThrowArgs} args - Arguments to find a Lead
     * @example
     * // Get one Lead
     * const lead = await prisma.lead.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LeadFindUniqueOrThrowArgs>(args: SelectSubset<T, LeadFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Lead that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadFindFirstArgs} args - Arguments to find a Lead
     * @example
     * // Get one Lead
     * const lead = await prisma.lead.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LeadFindFirstArgs>(args?: SelectSubset<T, LeadFindFirstArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Lead that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadFindFirstOrThrowArgs} args - Arguments to find a Lead
     * @example
     * // Get one Lead
     * const lead = await prisma.lead.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LeadFindFirstOrThrowArgs>(args?: SelectSubset<T, LeadFindFirstOrThrowArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Leads that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Leads
     * const leads = await prisma.lead.findMany()
     * 
     * // Get first 10 Leads
     * const leads = await prisma.lead.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const leadWithIdOnly = await prisma.lead.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LeadFindManyArgs>(args?: SelectSubset<T, LeadFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Lead.
     * @param {LeadCreateArgs} args - Arguments to create a Lead.
     * @example
     * // Create one Lead
     * const Lead = await prisma.lead.create({
     *   data: {
     *     // ... data to create a Lead
     *   }
     * })
     * 
     */
    create<T extends LeadCreateArgs>(args: SelectSubset<T, LeadCreateArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Leads.
     * @param {LeadCreateManyArgs} args - Arguments to create many Leads.
     * @example
     * // Create many Leads
     * const lead = await prisma.lead.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LeadCreateManyArgs>(args?: SelectSubset<T, LeadCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Leads and returns the data saved in the database.
     * @param {LeadCreateManyAndReturnArgs} args - Arguments to create many Leads.
     * @example
     * // Create many Leads
     * const lead = await prisma.lead.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Leads and only return the `id`
     * const leadWithIdOnly = await prisma.lead.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LeadCreateManyAndReturnArgs>(args?: SelectSubset<T, LeadCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Lead.
     * @param {LeadDeleteArgs} args - Arguments to delete one Lead.
     * @example
     * // Delete one Lead
     * const Lead = await prisma.lead.delete({
     *   where: {
     *     // ... filter to delete one Lead
     *   }
     * })
     * 
     */
    delete<T extends LeadDeleteArgs>(args: SelectSubset<T, LeadDeleteArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Lead.
     * @param {LeadUpdateArgs} args - Arguments to update one Lead.
     * @example
     * // Update one Lead
     * const lead = await prisma.lead.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LeadUpdateArgs>(args: SelectSubset<T, LeadUpdateArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Leads.
     * @param {LeadDeleteManyArgs} args - Arguments to filter Leads to delete.
     * @example
     * // Delete a few Leads
     * const { count } = await prisma.lead.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LeadDeleteManyArgs>(args?: SelectSubset<T, LeadDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Leads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Leads
     * const lead = await prisma.lead.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LeadUpdateManyArgs>(args: SelectSubset<T, LeadUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Leads and returns the data updated in the database.
     * @param {LeadUpdateManyAndReturnArgs} args - Arguments to update many Leads.
     * @example
     * // Update many Leads
     * const lead = await prisma.lead.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Leads and only return the `id`
     * const leadWithIdOnly = await prisma.lead.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LeadUpdateManyAndReturnArgs>(args: SelectSubset<T, LeadUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Lead.
     * @param {LeadUpsertArgs} args - Arguments to update or create a Lead.
     * @example
     * // Update or create a Lead
     * const lead = await prisma.lead.upsert({
     *   create: {
     *     // ... data to create a Lead
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Lead we want to update
     *   }
     * })
     */
    upsert<T extends LeadUpsertArgs>(args: SelectSubset<T, LeadUpsertArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Leads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadCountArgs} args - Arguments to filter Leads to count.
     * @example
     * // Count the number of Leads
     * const count = await prisma.lead.count({
     *   where: {
     *     // ... the filter for the Leads we want to count
     *   }
     * })
    **/
    count<T extends LeadCountArgs>(
      args?: Subset<T, LeadCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LeadCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Lead.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LeadAggregateArgs>(args: Subset<T, LeadAggregateArgs>): Prisma.PrismaPromise<GetLeadAggregateType<T>>

    /**
     * Group by Lead.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeadGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LeadGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LeadGroupByArgs['orderBy'] }
        : { orderBy?: LeadGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LeadGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLeadGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Lead model
   */
  readonly fields: LeadFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Lead.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LeadClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    contact<T extends Lead$contactArgs<ExtArgs> = {}>(args?: Subset<T, Lead$contactArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    activities<T extends Lead$activitiesArgs<ExtArgs> = {}>(args?: Subset<T, Lead$activitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Lead model
   */
  interface LeadFieldRefs {
    readonly id: FieldRef<"Lead", 'String'>
    readonly tenantId: FieldRef<"Lead", 'String'>
    readonly contactId: FieldRef<"Lead", 'String'>
    readonly status: FieldRef<"Lead", 'String'>
    readonly leadType: FieldRef<"Lead", 'String'>
    readonly source: FieldRef<"Lead", 'String'>
    readonly timeframe: FieldRef<"Lead", 'String'>
    readonly notes: FieldRef<"Lead", 'String'>
    readonly listingId: FieldRef<"Lead", 'String'>
    readonly listingUrl: FieldRef<"Lead", 'String'>
    readonly listingAddress: FieldRef<"Lead", 'String'>
    readonly propertyType: FieldRef<"Lead", 'String'>
    readonly beds: FieldRef<"Lead", 'Int'>
    readonly baths: FieldRef<"Lead", 'Int'>
    readonly sqft: FieldRef<"Lead", 'Int'>
    readonly createdAt: FieldRef<"Lead", 'DateTime'>
    readonly updatedAt: FieldRef<"Lead", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Lead findUnique
   */
  export type LeadFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * Filter, which Lead to fetch.
     */
    where: LeadWhereUniqueInput
  }

  /**
   * Lead findUniqueOrThrow
   */
  export type LeadFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * Filter, which Lead to fetch.
     */
    where: LeadWhereUniqueInput
  }

  /**
   * Lead findFirst
   */
  export type LeadFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * Filter, which Lead to fetch.
     */
    where?: LeadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leads to fetch.
     */
    orderBy?: LeadOrderByWithRelationInput | LeadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Leads.
     */
    cursor?: LeadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Leads.
     */
    distinct?: LeadScalarFieldEnum | LeadScalarFieldEnum[]
  }

  /**
   * Lead findFirstOrThrow
   */
  export type LeadFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * Filter, which Lead to fetch.
     */
    where?: LeadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leads to fetch.
     */
    orderBy?: LeadOrderByWithRelationInput | LeadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Leads.
     */
    cursor?: LeadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Leads.
     */
    distinct?: LeadScalarFieldEnum | LeadScalarFieldEnum[]
  }

  /**
   * Lead findMany
   */
  export type LeadFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * Filter, which Leads to fetch.
     */
    where?: LeadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leads to fetch.
     */
    orderBy?: LeadOrderByWithRelationInput | LeadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Leads.
     */
    cursor?: LeadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leads.
     */
    skip?: number
    distinct?: LeadScalarFieldEnum | LeadScalarFieldEnum[]
  }

  /**
   * Lead create
   */
  export type LeadCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * The data needed to create a Lead.
     */
    data: XOR<LeadCreateInput, LeadUncheckedCreateInput>
  }

  /**
   * Lead createMany
   */
  export type LeadCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Leads.
     */
    data: LeadCreateManyInput | LeadCreateManyInput[]
  }

  /**
   * Lead createManyAndReturn
   */
  export type LeadCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * The data used to create many Leads.
     */
    data: LeadCreateManyInput | LeadCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Lead update
   */
  export type LeadUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * The data needed to update a Lead.
     */
    data: XOR<LeadUpdateInput, LeadUncheckedUpdateInput>
    /**
     * Choose, which Lead to update.
     */
    where: LeadWhereUniqueInput
  }

  /**
   * Lead updateMany
   */
  export type LeadUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Leads.
     */
    data: XOR<LeadUpdateManyMutationInput, LeadUncheckedUpdateManyInput>
    /**
     * Filter which Leads to update
     */
    where?: LeadWhereInput
    /**
     * Limit how many Leads to update.
     */
    limit?: number
  }

  /**
   * Lead updateManyAndReturn
   */
  export type LeadUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * The data used to update Leads.
     */
    data: XOR<LeadUpdateManyMutationInput, LeadUncheckedUpdateManyInput>
    /**
     * Filter which Leads to update
     */
    where?: LeadWhereInput
    /**
     * Limit how many Leads to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Lead upsert
   */
  export type LeadUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * The filter to search for the Lead to update in case it exists.
     */
    where: LeadWhereUniqueInput
    /**
     * In case the Lead found by the `where` argument doesn't exist, create a new Lead with this data.
     */
    create: XOR<LeadCreateInput, LeadUncheckedCreateInput>
    /**
     * In case the Lead was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LeadUpdateInput, LeadUncheckedUpdateInput>
  }

  /**
   * Lead delete
   */
  export type LeadDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    /**
     * Filter which Lead to delete.
     */
    where: LeadWhereUniqueInput
  }

  /**
   * Lead deleteMany
   */
  export type LeadDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Leads to delete
     */
    where?: LeadWhereInput
    /**
     * Limit how many Leads to delete.
     */
    limit?: number
  }

  /**
   * Lead.contact
   */
  export type Lead$contactArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    where?: ContactWhereInput
  }

  /**
   * Lead.activities
   */
  export type Lead$activitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    where?: ActivityWhereInput
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    cursor?: ActivityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Lead without action
   */
  export type LeadDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
  }


  /**
   * Model Activity
   */

  export type AggregateActivity = {
    _count: ActivityCountAggregateOutputType | null
    _min: ActivityMinAggregateOutputType | null
    _max: ActivityMaxAggregateOutputType | null
  }

  export type ActivityMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    contactId: string | null
    leadId: string | null
    activityType: string | null
    occurredAt: Date | null
    summary: string | null
    metadataJson: string | null
    createdAt: Date | null
  }

  export type ActivityMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    contactId: string | null
    leadId: string | null
    activityType: string | null
    occurredAt: Date | null
    summary: string | null
    metadataJson: string | null
    createdAt: Date | null
  }

  export type ActivityCountAggregateOutputType = {
    id: number
    tenantId: number
    contactId: number
    leadId: number
    activityType: number
    occurredAt: number
    summary: number
    metadataJson: number
    createdAt: number
    _all: number
  }


  export type ActivityMinAggregateInputType = {
    id?: true
    tenantId?: true
    contactId?: true
    leadId?: true
    activityType?: true
    occurredAt?: true
    summary?: true
    metadataJson?: true
    createdAt?: true
  }

  export type ActivityMaxAggregateInputType = {
    id?: true
    tenantId?: true
    contactId?: true
    leadId?: true
    activityType?: true
    occurredAt?: true
    summary?: true
    metadataJson?: true
    createdAt?: true
  }

  export type ActivityCountAggregateInputType = {
    id?: true
    tenantId?: true
    contactId?: true
    leadId?: true
    activityType?: true
    occurredAt?: true
    summary?: true
    metadataJson?: true
    createdAt?: true
    _all?: true
  }

  export type ActivityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Activity to aggregate.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Activities
    **/
    _count?: true | ActivityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ActivityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ActivityMaxAggregateInputType
  }

  export type GetActivityAggregateType<T extends ActivityAggregateArgs> = {
        [P in keyof T & keyof AggregateActivity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateActivity[P]>
      : GetScalarType<T[P], AggregateActivity[P]>
  }




  export type ActivityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityWhereInput
    orderBy?: ActivityOrderByWithAggregationInput | ActivityOrderByWithAggregationInput[]
    by: ActivityScalarFieldEnum[] | ActivityScalarFieldEnum
    having?: ActivityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ActivityCountAggregateInputType | true
    _min?: ActivityMinAggregateInputType
    _max?: ActivityMaxAggregateInputType
  }

  export type ActivityGroupByOutputType = {
    id: string
    tenantId: string
    contactId: string | null
    leadId: string | null
    activityType: string
    occurredAt: Date
    summary: string
    metadataJson: string | null
    createdAt: Date
    _count: ActivityCountAggregateOutputType | null
    _min: ActivityMinAggregateOutputType | null
    _max: ActivityMaxAggregateOutputType | null
  }

  type GetActivityGroupByPayload<T extends ActivityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ActivityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ActivityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ActivityGroupByOutputType[P]>
            : GetScalarType<T[P], ActivityGroupByOutputType[P]>
        }
      >
    >


  export type ActivitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    leadId?: boolean
    activityType?: boolean
    occurredAt?: boolean
    summary?: boolean
    metadataJson?: boolean
    createdAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Activity$contactArgs<ExtArgs>
    lead?: boolean | Activity$leadArgs<ExtArgs>
  }, ExtArgs["result"]["activity"]>

  export type ActivitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    leadId?: boolean
    activityType?: boolean
    occurredAt?: boolean
    summary?: boolean
    metadataJson?: boolean
    createdAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Activity$contactArgs<ExtArgs>
    lead?: boolean | Activity$leadArgs<ExtArgs>
  }, ExtArgs["result"]["activity"]>

  export type ActivitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    leadId?: boolean
    activityType?: boolean
    occurredAt?: boolean
    summary?: boolean
    metadataJson?: boolean
    createdAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Activity$contactArgs<ExtArgs>
    lead?: boolean | Activity$leadArgs<ExtArgs>
  }, ExtArgs["result"]["activity"]>

  export type ActivitySelectScalar = {
    id?: boolean
    tenantId?: boolean
    contactId?: boolean
    leadId?: boolean
    activityType?: boolean
    occurredAt?: boolean
    summary?: boolean
    metadataJson?: boolean
    createdAt?: boolean
  }

  export type ActivityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "contactId" | "leadId" | "activityType" | "occurredAt" | "summary" | "metadataJson" | "createdAt", ExtArgs["result"]["activity"]>
  export type ActivityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Activity$contactArgs<ExtArgs>
    lead?: boolean | Activity$leadArgs<ExtArgs>
  }
  export type ActivityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Activity$contactArgs<ExtArgs>
    lead?: boolean | Activity$leadArgs<ExtArgs>
  }
  export type ActivityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
    contact?: boolean | Activity$contactArgs<ExtArgs>
    lead?: boolean | Activity$leadArgs<ExtArgs>
  }

  export type $ActivityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Activity"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
      contact: Prisma.$ContactPayload<ExtArgs> | null
      lead: Prisma.$LeadPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      contactId: string | null
      leadId: string | null
      activityType: string
      occurredAt: Date
      summary: string
      metadataJson: string | null
      createdAt: Date
    }, ExtArgs["result"]["activity"]>
    composites: {}
  }

  type ActivityGetPayload<S extends boolean | null | undefined | ActivityDefaultArgs> = $Result.GetResult<Prisma.$ActivityPayload, S>

  type ActivityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ActivityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ActivityCountAggregateInputType | true
    }

  export interface ActivityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Activity'], meta: { name: 'Activity' } }
    /**
     * Find zero or one Activity that matches the filter.
     * @param {ActivityFindUniqueArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ActivityFindUniqueArgs>(args: SelectSubset<T, ActivityFindUniqueArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Activity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ActivityFindUniqueOrThrowArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ActivityFindUniqueOrThrowArgs>(args: SelectSubset<T, ActivityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Activity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityFindFirstArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ActivityFindFirstArgs>(args?: SelectSubset<T, ActivityFindFirstArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Activity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityFindFirstOrThrowArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ActivityFindFirstOrThrowArgs>(args?: SelectSubset<T, ActivityFindFirstOrThrowArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Activities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Activities
     * const activities = await prisma.activity.findMany()
     * 
     * // Get first 10 Activities
     * const activities = await prisma.activity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const activityWithIdOnly = await prisma.activity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ActivityFindManyArgs>(args?: SelectSubset<T, ActivityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Activity.
     * @param {ActivityCreateArgs} args - Arguments to create a Activity.
     * @example
     * // Create one Activity
     * const Activity = await prisma.activity.create({
     *   data: {
     *     // ... data to create a Activity
     *   }
     * })
     * 
     */
    create<T extends ActivityCreateArgs>(args: SelectSubset<T, ActivityCreateArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Activities.
     * @param {ActivityCreateManyArgs} args - Arguments to create many Activities.
     * @example
     * // Create many Activities
     * const activity = await prisma.activity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ActivityCreateManyArgs>(args?: SelectSubset<T, ActivityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Activities and returns the data saved in the database.
     * @param {ActivityCreateManyAndReturnArgs} args - Arguments to create many Activities.
     * @example
     * // Create many Activities
     * const activity = await prisma.activity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Activities and only return the `id`
     * const activityWithIdOnly = await prisma.activity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ActivityCreateManyAndReturnArgs>(args?: SelectSubset<T, ActivityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Activity.
     * @param {ActivityDeleteArgs} args - Arguments to delete one Activity.
     * @example
     * // Delete one Activity
     * const Activity = await prisma.activity.delete({
     *   where: {
     *     // ... filter to delete one Activity
     *   }
     * })
     * 
     */
    delete<T extends ActivityDeleteArgs>(args: SelectSubset<T, ActivityDeleteArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Activity.
     * @param {ActivityUpdateArgs} args - Arguments to update one Activity.
     * @example
     * // Update one Activity
     * const activity = await prisma.activity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ActivityUpdateArgs>(args: SelectSubset<T, ActivityUpdateArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Activities.
     * @param {ActivityDeleteManyArgs} args - Arguments to filter Activities to delete.
     * @example
     * // Delete a few Activities
     * const { count } = await prisma.activity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ActivityDeleteManyArgs>(args?: SelectSubset<T, ActivityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Activities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Activities
     * const activity = await prisma.activity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ActivityUpdateManyArgs>(args: SelectSubset<T, ActivityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Activities and returns the data updated in the database.
     * @param {ActivityUpdateManyAndReturnArgs} args - Arguments to update many Activities.
     * @example
     * // Update many Activities
     * const activity = await prisma.activity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Activities and only return the `id`
     * const activityWithIdOnly = await prisma.activity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ActivityUpdateManyAndReturnArgs>(args: SelectSubset<T, ActivityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Activity.
     * @param {ActivityUpsertArgs} args - Arguments to update or create a Activity.
     * @example
     * // Update or create a Activity
     * const activity = await prisma.activity.upsert({
     *   create: {
     *     // ... data to create a Activity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Activity we want to update
     *   }
     * })
     */
    upsert<T extends ActivityUpsertArgs>(args: SelectSubset<T, ActivityUpsertArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Activities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityCountArgs} args - Arguments to filter Activities to count.
     * @example
     * // Count the number of Activities
     * const count = await prisma.activity.count({
     *   where: {
     *     // ... the filter for the Activities we want to count
     *   }
     * })
    **/
    count<T extends ActivityCountArgs>(
      args?: Subset<T, ActivityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ActivityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Activity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ActivityAggregateArgs>(args: Subset<T, ActivityAggregateArgs>): Prisma.PrismaPromise<GetActivityAggregateType<T>>

    /**
     * Group by Activity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ActivityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ActivityGroupByArgs['orderBy'] }
        : { orderBy?: ActivityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ActivityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetActivityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Activity model
   */
  readonly fields: ActivityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Activity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ActivityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    contact<T extends Activity$contactArgs<ExtArgs> = {}>(args?: Subset<T, Activity$contactArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    lead<T extends Activity$leadArgs<ExtArgs> = {}>(args?: Subset<T, Activity$leadArgs<ExtArgs>>): Prisma__LeadClient<$Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Activity model
   */
  interface ActivityFieldRefs {
    readonly id: FieldRef<"Activity", 'String'>
    readonly tenantId: FieldRef<"Activity", 'String'>
    readonly contactId: FieldRef<"Activity", 'String'>
    readonly leadId: FieldRef<"Activity", 'String'>
    readonly activityType: FieldRef<"Activity", 'String'>
    readonly occurredAt: FieldRef<"Activity", 'DateTime'>
    readonly summary: FieldRef<"Activity", 'String'>
    readonly metadataJson: FieldRef<"Activity", 'String'>
    readonly createdAt: FieldRef<"Activity", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Activity findUnique
   */
  export type ActivityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity findUniqueOrThrow
   */
  export type ActivityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity findFirst
   */
  export type ActivityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Activities.
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Activities.
     */
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Activity findFirstOrThrow
   */
  export type ActivityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Activities.
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Activities.
     */
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Activity findMany
   */
  export type ActivityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activities to fetch.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Activities.
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Activity create
   */
  export type ActivityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * The data needed to create a Activity.
     */
    data: XOR<ActivityCreateInput, ActivityUncheckedCreateInput>
  }

  /**
   * Activity createMany
   */
  export type ActivityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Activities.
     */
    data: ActivityCreateManyInput | ActivityCreateManyInput[]
  }

  /**
   * Activity createManyAndReturn
   */
  export type ActivityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * The data used to create many Activities.
     */
    data: ActivityCreateManyInput | ActivityCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Activity update
   */
  export type ActivityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * The data needed to update a Activity.
     */
    data: XOR<ActivityUpdateInput, ActivityUncheckedUpdateInput>
    /**
     * Choose, which Activity to update.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity updateMany
   */
  export type ActivityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Activities.
     */
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyInput>
    /**
     * Filter which Activities to update
     */
    where?: ActivityWhereInput
    /**
     * Limit how many Activities to update.
     */
    limit?: number
  }

  /**
   * Activity updateManyAndReturn
   */
  export type ActivityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * The data used to update Activities.
     */
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyInput>
    /**
     * Filter which Activities to update
     */
    where?: ActivityWhereInput
    /**
     * Limit how many Activities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Activity upsert
   */
  export type ActivityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * The filter to search for the Activity to update in case it exists.
     */
    where: ActivityWhereUniqueInput
    /**
     * In case the Activity found by the `where` argument doesn't exist, create a new Activity with this data.
     */
    create: XOR<ActivityCreateInput, ActivityUncheckedCreateInput>
    /**
     * In case the Activity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ActivityUpdateInput, ActivityUncheckedUpdateInput>
  }

  /**
   * Activity delete
   */
  export type ActivityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter which Activity to delete.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity deleteMany
   */
  export type ActivityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Activities to delete
     */
    where?: ActivityWhereInput
    /**
     * Limit how many Activities to delete.
     */
    limit?: number
  }

  /**
   * Activity.contact
   */
  export type Activity$contactArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    where?: ContactWhereInput
  }

  /**
   * Activity.lead
   */
  export type Activity$leadArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lead
     */
    select?: LeadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lead
     */
    omit?: LeadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeadInclude<ExtArgs> | null
    where?: LeadWhereInput
  }

  /**
   * Activity without action
   */
  export type ActivityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
  }


  /**
   * Model IngestedEvent
   */

  export type AggregateIngestedEvent = {
    _count: IngestedEventCountAggregateOutputType | null
    _min: IngestedEventMinAggregateOutputType | null
    _max: IngestedEventMaxAggregateOutputType | null
  }

  export type IngestedEventMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    eventType: string | null
    eventKey: string | null
    occurredAt: Date | null
    payloadJson: string | null
    processedAt: Date | null
    createdAt: Date | null
  }

  export type IngestedEventMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    eventType: string | null
    eventKey: string | null
    occurredAt: Date | null
    payloadJson: string | null
    processedAt: Date | null
    createdAt: Date | null
  }

  export type IngestedEventCountAggregateOutputType = {
    id: number
    tenantId: number
    eventType: number
    eventKey: number
    occurredAt: number
    payloadJson: number
    processedAt: number
    createdAt: number
    _all: number
  }


  export type IngestedEventMinAggregateInputType = {
    id?: true
    tenantId?: true
    eventType?: true
    eventKey?: true
    occurredAt?: true
    payloadJson?: true
    processedAt?: true
    createdAt?: true
  }

  export type IngestedEventMaxAggregateInputType = {
    id?: true
    tenantId?: true
    eventType?: true
    eventKey?: true
    occurredAt?: true
    payloadJson?: true
    processedAt?: true
    createdAt?: true
  }

  export type IngestedEventCountAggregateInputType = {
    id?: true
    tenantId?: true
    eventType?: true
    eventKey?: true
    occurredAt?: true
    payloadJson?: true
    processedAt?: true
    createdAt?: true
    _all?: true
  }

  export type IngestedEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IngestedEvent to aggregate.
     */
    where?: IngestedEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestedEvents to fetch.
     */
    orderBy?: IngestedEventOrderByWithRelationInput | IngestedEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IngestedEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestedEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestedEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IngestedEvents
    **/
    _count?: true | IngestedEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IngestedEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IngestedEventMaxAggregateInputType
  }

  export type GetIngestedEventAggregateType<T extends IngestedEventAggregateArgs> = {
        [P in keyof T & keyof AggregateIngestedEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIngestedEvent[P]>
      : GetScalarType<T[P], AggregateIngestedEvent[P]>
  }




  export type IngestedEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IngestedEventWhereInput
    orderBy?: IngestedEventOrderByWithAggregationInput | IngestedEventOrderByWithAggregationInput[]
    by: IngestedEventScalarFieldEnum[] | IngestedEventScalarFieldEnum
    having?: IngestedEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IngestedEventCountAggregateInputType | true
    _min?: IngestedEventMinAggregateInputType
    _max?: IngestedEventMaxAggregateInputType
  }

  export type IngestedEventGroupByOutputType = {
    id: string
    tenantId: string
    eventType: string
    eventKey: string
    occurredAt: Date
    payloadJson: string
    processedAt: Date
    createdAt: Date
    _count: IngestedEventCountAggregateOutputType | null
    _min: IngestedEventMinAggregateOutputType | null
    _max: IngestedEventMaxAggregateOutputType | null
  }

  type GetIngestedEventGroupByPayload<T extends IngestedEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IngestedEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IngestedEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IngestedEventGroupByOutputType[P]>
            : GetScalarType<T[P], IngestedEventGroupByOutputType[P]>
        }
      >
    >


  export type IngestedEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    processedAt?: boolean
    createdAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ingestedEvent"]>

  export type IngestedEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    processedAt?: boolean
    createdAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ingestedEvent"]>

  export type IngestedEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    processedAt?: boolean
    createdAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ingestedEvent"]>

  export type IngestedEventSelectScalar = {
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    processedAt?: boolean
    createdAt?: boolean
  }

  export type IngestedEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "eventType" | "eventKey" | "occurredAt" | "payloadJson" | "processedAt" | "createdAt", ExtArgs["result"]["ingestedEvent"]>
  export type IngestedEventInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type IngestedEventIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type IngestedEventIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $IngestedEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IngestedEvent"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      eventType: string
      eventKey: string
      occurredAt: Date
      payloadJson: string
      processedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["ingestedEvent"]>
    composites: {}
  }

  type IngestedEventGetPayload<S extends boolean | null | undefined | IngestedEventDefaultArgs> = $Result.GetResult<Prisma.$IngestedEventPayload, S>

  type IngestedEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IngestedEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IngestedEventCountAggregateInputType | true
    }

  export interface IngestedEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IngestedEvent'], meta: { name: 'IngestedEvent' } }
    /**
     * Find zero or one IngestedEvent that matches the filter.
     * @param {IngestedEventFindUniqueArgs} args - Arguments to find a IngestedEvent
     * @example
     * // Get one IngestedEvent
     * const ingestedEvent = await prisma.ingestedEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IngestedEventFindUniqueArgs>(args: SelectSubset<T, IngestedEventFindUniqueArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IngestedEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IngestedEventFindUniqueOrThrowArgs} args - Arguments to find a IngestedEvent
     * @example
     * // Get one IngestedEvent
     * const ingestedEvent = await prisma.ingestedEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IngestedEventFindUniqueOrThrowArgs>(args: SelectSubset<T, IngestedEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IngestedEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventFindFirstArgs} args - Arguments to find a IngestedEvent
     * @example
     * // Get one IngestedEvent
     * const ingestedEvent = await prisma.ingestedEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IngestedEventFindFirstArgs>(args?: SelectSubset<T, IngestedEventFindFirstArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IngestedEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventFindFirstOrThrowArgs} args - Arguments to find a IngestedEvent
     * @example
     * // Get one IngestedEvent
     * const ingestedEvent = await prisma.ingestedEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IngestedEventFindFirstOrThrowArgs>(args?: SelectSubset<T, IngestedEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IngestedEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IngestedEvents
     * const ingestedEvents = await prisma.ingestedEvent.findMany()
     * 
     * // Get first 10 IngestedEvents
     * const ingestedEvents = await prisma.ingestedEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ingestedEventWithIdOnly = await prisma.ingestedEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IngestedEventFindManyArgs>(args?: SelectSubset<T, IngestedEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IngestedEvent.
     * @param {IngestedEventCreateArgs} args - Arguments to create a IngestedEvent.
     * @example
     * // Create one IngestedEvent
     * const IngestedEvent = await prisma.ingestedEvent.create({
     *   data: {
     *     // ... data to create a IngestedEvent
     *   }
     * })
     * 
     */
    create<T extends IngestedEventCreateArgs>(args: SelectSubset<T, IngestedEventCreateArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IngestedEvents.
     * @param {IngestedEventCreateManyArgs} args - Arguments to create many IngestedEvents.
     * @example
     * // Create many IngestedEvents
     * const ingestedEvent = await prisma.ingestedEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IngestedEventCreateManyArgs>(args?: SelectSubset<T, IngestedEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IngestedEvents and returns the data saved in the database.
     * @param {IngestedEventCreateManyAndReturnArgs} args - Arguments to create many IngestedEvents.
     * @example
     * // Create many IngestedEvents
     * const ingestedEvent = await prisma.ingestedEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IngestedEvents and only return the `id`
     * const ingestedEventWithIdOnly = await prisma.ingestedEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IngestedEventCreateManyAndReturnArgs>(args?: SelectSubset<T, IngestedEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IngestedEvent.
     * @param {IngestedEventDeleteArgs} args - Arguments to delete one IngestedEvent.
     * @example
     * // Delete one IngestedEvent
     * const IngestedEvent = await prisma.ingestedEvent.delete({
     *   where: {
     *     // ... filter to delete one IngestedEvent
     *   }
     * })
     * 
     */
    delete<T extends IngestedEventDeleteArgs>(args: SelectSubset<T, IngestedEventDeleteArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IngestedEvent.
     * @param {IngestedEventUpdateArgs} args - Arguments to update one IngestedEvent.
     * @example
     * // Update one IngestedEvent
     * const ingestedEvent = await prisma.ingestedEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IngestedEventUpdateArgs>(args: SelectSubset<T, IngestedEventUpdateArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IngestedEvents.
     * @param {IngestedEventDeleteManyArgs} args - Arguments to filter IngestedEvents to delete.
     * @example
     * // Delete a few IngestedEvents
     * const { count } = await prisma.ingestedEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IngestedEventDeleteManyArgs>(args?: SelectSubset<T, IngestedEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IngestedEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IngestedEvents
     * const ingestedEvent = await prisma.ingestedEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IngestedEventUpdateManyArgs>(args: SelectSubset<T, IngestedEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IngestedEvents and returns the data updated in the database.
     * @param {IngestedEventUpdateManyAndReturnArgs} args - Arguments to update many IngestedEvents.
     * @example
     * // Update many IngestedEvents
     * const ingestedEvent = await prisma.ingestedEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IngestedEvents and only return the `id`
     * const ingestedEventWithIdOnly = await prisma.ingestedEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IngestedEventUpdateManyAndReturnArgs>(args: SelectSubset<T, IngestedEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IngestedEvent.
     * @param {IngestedEventUpsertArgs} args - Arguments to update or create a IngestedEvent.
     * @example
     * // Update or create a IngestedEvent
     * const ingestedEvent = await prisma.ingestedEvent.upsert({
     *   create: {
     *     // ... data to create a IngestedEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IngestedEvent we want to update
     *   }
     * })
     */
    upsert<T extends IngestedEventUpsertArgs>(args: SelectSubset<T, IngestedEventUpsertArgs<ExtArgs>>): Prisma__IngestedEventClient<$Result.GetResult<Prisma.$IngestedEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IngestedEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventCountArgs} args - Arguments to filter IngestedEvents to count.
     * @example
     * // Count the number of IngestedEvents
     * const count = await prisma.ingestedEvent.count({
     *   where: {
     *     // ... the filter for the IngestedEvents we want to count
     *   }
     * })
    **/
    count<T extends IngestedEventCountArgs>(
      args?: Subset<T, IngestedEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IngestedEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IngestedEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IngestedEventAggregateArgs>(args: Subset<T, IngestedEventAggregateArgs>): Prisma.PrismaPromise<GetIngestedEventAggregateType<T>>

    /**
     * Group by IngestedEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestedEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IngestedEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IngestedEventGroupByArgs['orderBy'] }
        : { orderBy?: IngestedEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IngestedEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIngestedEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IngestedEvent model
   */
  readonly fields: IngestedEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IngestedEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IngestedEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IngestedEvent model
   */
  interface IngestedEventFieldRefs {
    readonly id: FieldRef<"IngestedEvent", 'String'>
    readonly tenantId: FieldRef<"IngestedEvent", 'String'>
    readonly eventType: FieldRef<"IngestedEvent", 'String'>
    readonly eventKey: FieldRef<"IngestedEvent", 'String'>
    readonly occurredAt: FieldRef<"IngestedEvent", 'DateTime'>
    readonly payloadJson: FieldRef<"IngestedEvent", 'String'>
    readonly processedAt: FieldRef<"IngestedEvent", 'DateTime'>
    readonly createdAt: FieldRef<"IngestedEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IngestedEvent findUnique
   */
  export type IngestedEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * Filter, which IngestedEvent to fetch.
     */
    where: IngestedEventWhereUniqueInput
  }

  /**
   * IngestedEvent findUniqueOrThrow
   */
  export type IngestedEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * Filter, which IngestedEvent to fetch.
     */
    where: IngestedEventWhereUniqueInput
  }

  /**
   * IngestedEvent findFirst
   */
  export type IngestedEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * Filter, which IngestedEvent to fetch.
     */
    where?: IngestedEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestedEvents to fetch.
     */
    orderBy?: IngestedEventOrderByWithRelationInput | IngestedEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IngestedEvents.
     */
    cursor?: IngestedEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestedEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestedEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IngestedEvents.
     */
    distinct?: IngestedEventScalarFieldEnum | IngestedEventScalarFieldEnum[]
  }

  /**
   * IngestedEvent findFirstOrThrow
   */
  export type IngestedEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * Filter, which IngestedEvent to fetch.
     */
    where?: IngestedEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestedEvents to fetch.
     */
    orderBy?: IngestedEventOrderByWithRelationInput | IngestedEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IngestedEvents.
     */
    cursor?: IngestedEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestedEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestedEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IngestedEvents.
     */
    distinct?: IngestedEventScalarFieldEnum | IngestedEventScalarFieldEnum[]
  }

  /**
   * IngestedEvent findMany
   */
  export type IngestedEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * Filter, which IngestedEvents to fetch.
     */
    where?: IngestedEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestedEvents to fetch.
     */
    orderBy?: IngestedEventOrderByWithRelationInput | IngestedEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IngestedEvents.
     */
    cursor?: IngestedEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestedEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestedEvents.
     */
    skip?: number
    distinct?: IngestedEventScalarFieldEnum | IngestedEventScalarFieldEnum[]
  }

  /**
   * IngestedEvent create
   */
  export type IngestedEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * The data needed to create a IngestedEvent.
     */
    data: XOR<IngestedEventCreateInput, IngestedEventUncheckedCreateInput>
  }

  /**
   * IngestedEvent createMany
   */
  export type IngestedEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IngestedEvents.
     */
    data: IngestedEventCreateManyInput | IngestedEventCreateManyInput[]
  }

  /**
   * IngestedEvent createManyAndReturn
   */
  export type IngestedEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * The data used to create many IngestedEvents.
     */
    data: IngestedEventCreateManyInput | IngestedEventCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IngestedEvent update
   */
  export type IngestedEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * The data needed to update a IngestedEvent.
     */
    data: XOR<IngestedEventUpdateInput, IngestedEventUncheckedUpdateInput>
    /**
     * Choose, which IngestedEvent to update.
     */
    where: IngestedEventWhereUniqueInput
  }

  /**
   * IngestedEvent updateMany
   */
  export type IngestedEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IngestedEvents.
     */
    data: XOR<IngestedEventUpdateManyMutationInput, IngestedEventUncheckedUpdateManyInput>
    /**
     * Filter which IngestedEvents to update
     */
    where?: IngestedEventWhereInput
    /**
     * Limit how many IngestedEvents to update.
     */
    limit?: number
  }

  /**
   * IngestedEvent updateManyAndReturn
   */
  export type IngestedEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * The data used to update IngestedEvents.
     */
    data: XOR<IngestedEventUpdateManyMutationInput, IngestedEventUncheckedUpdateManyInput>
    /**
     * Filter which IngestedEvents to update
     */
    where?: IngestedEventWhereInput
    /**
     * Limit how many IngestedEvents to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IngestedEvent upsert
   */
  export type IngestedEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * The filter to search for the IngestedEvent to update in case it exists.
     */
    where: IngestedEventWhereUniqueInput
    /**
     * In case the IngestedEvent found by the `where` argument doesn't exist, create a new IngestedEvent with this data.
     */
    create: XOR<IngestedEventCreateInput, IngestedEventUncheckedCreateInput>
    /**
     * In case the IngestedEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IngestedEventUpdateInput, IngestedEventUncheckedUpdateInput>
  }

  /**
   * IngestedEvent delete
   */
  export type IngestedEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
    /**
     * Filter which IngestedEvent to delete.
     */
    where: IngestedEventWhereUniqueInput
  }

  /**
   * IngestedEvent deleteMany
   */
  export type IngestedEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IngestedEvents to delete
     */
    where?: IngestedEventWhereInput
    /**
     * Limit how many IngestedEvents to delete.
     */
    limit?: number
  }

  /**
   * IngestedEvent without action
   */
  export type IngestedEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestedEvent
     */
    select?: IngestedEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestedEvent
     */
    omit?: IngestedEventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestedEventInclude<ExtArgs> | null
  }


  /**
   * Model IngestionQueueJob
   */

  export type AggregateIngestionQueueJob = {
    _count: IngestionQueueJobCountAggregateOutputType | null
    _avg: IngestionQueueJobAvgAggregateOutputType | null
    _sum: IngestionQueueJobSumAggregateOutputType | null
    _min: IngestionQueueJobMinAggregateOutputType | null
    _max: IngestionQueueJobMaxAggregateOutputType | null
  }

  export type IngestionQueueJobAvgAggregateOutputType = {
    attemptCount: number | null
  }

  export type IngestionQueueJobSumAggregateOutputType = {
    attemptCount: number | null
  }

  export type IngestionQueueJobMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    eventType: string | null
    eventKey: string | null
    occurredAt: Date | null
    payloadJson: string | null
    status: string | null
    attemptCount: number | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
    processedAt: Date | null
    nextAttemptAt: Date | null
    deadLetteredAt: Date | null
  }

  export type IngestionQueueJobMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    eventType: string | null
    eventKey: string | null
    occurredAt: Date | null
    payloadJson: string | null
    status: string | null
    attemptCount: number | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
    processedAt: Date | null
    nextAttemptAt: Date | null
    deadLetteredAt: Date | null
  }

  export type IngestionQueueJobCountAggregateOutputType = {
    id: number
    tenantId: number
    eventType: number
    eventKey: number
    occurredAt: number
    payloadJson: number
    status: number
    attemptCount: number
    lastError: number
    createdAt: number
    updatedAt: number
    processedAt: number
    nextAttemptAt: number
    deadLetteredAt: number
    _all: number
  }


  export type IngestionQueueJobAvgAggregateInputType = {
    attemptCount?: true
  }

  export type IngestionQueueJobSumAggregateInputType = {
    attemptCount?: true
  }

  export type IngestionQueueJobMinAggregateInputType = {
    id?: true
    tenantId?: true
    eventType?: true
    eventKey?: true
    occurredAt?: true
    payloadJson?: true
    status?: true
    attemptCount?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    processedAt?: true
    nextAttemptAt?: true
    deadLetteredAt?: true
  }

  export type IngestionQueueJobMaxAggregateInputType = {
    id?: true
    tenantId?: true
    eventType?: true
    eventKey?: true
    occurredAt?: true
    payloadJson?: true
    status?: true
    attemptCount?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    processedAt?: true
    nextAttemptAt?: true
    deadLetteredAt?: true
  }

  export type IngestionQueueJobCountAggregateInputType = {
    id?: true
    tenantId?: true
    eventType?: true
    eventKey?: true
    occurredAt?: true
    payloadJson?: true
    status?: true
    attemptCount?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    processedAt?: true
    nextAttemptAt?: true
    deadLetteredAt?: true
    _all?: true
  }

  export type IngestionQueueJobAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IngestionQueueJob to aggregate.
     */
    where?: IngestionQueueJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestionQueueJobs to fetch.
     */
    orderBy?: IngestionQueueJobOrderByWithRelationInput | IngestionQueueJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IngestionQueueJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestionQueueJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestionQueueJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IngestionQueueJobs
    **/
    _count?: true | IngestionQueueJobCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IngestionQueueJobAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IngestionQueueJobSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IngestionQueueJobMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IngestionQueueJobMaxAggregateInputType
  }

  export type GetIngestionQueueJobAggregateType<T extends IngestionQueueJobAggregateArgs> = {
        [P in keyof T & keyof AggregateIngestionQueueJob]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIngestionQueueJob[P]>
      : GetScalarType<T[P], AggregateIngestionQueueJob[P]>
  }




  export type IngestionQueueJobGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IngestionQueueJobWhereInput
    orderBy?: IngestionQueueJobOrderByWithAggregationInput | IngestionQueueJobOrderByWithAggregationInput[]
    by: IngestionQueueJobScalarFieldEnum[] | IngestionQueueJobScalarFieldEnum
    having?: IngestionQueueJobScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IngestionQueueJobCountAggregateInputType | true
    _avg?: IngestionQueueJobAvgAggregateInputType
    _sum?: IngestionQueueJobSumAggregateInputType
    _min?: IngestionQueueJobMinAggregateInputType
    _max?: IngestionQueueJobMaxAggregateInputType
  }

  export type IngestionQueueJobGroupByOutputType = {
    id: string
    tenantId: string
    eventType: string
    eventKey: string
    occurredAt: Date
    payloadJson: string
    status: string
    attemptCount: number
    lastError: string | null
    createdAt: Date
    updatedAt: Date
    processedAt: Date | null
    nextAttemptAt: Date
    deadLetteredAt: Date | null
    _count: IngestionQueueJobCountAggregateOutputType | null
    _avg: IngestionQueueJobAvgAggregateOutputType | null
    _sum: IngestionQueueJobSumAggregateOutputType | null
    _min: IngestionQueueJobMinAggregateOutputType | null
    _max: IngestionQueueJobMaxAggregateOutputType | null
  }

  type GetIngestionQueueJobGroupByPayload<T extends IngestionQueueJobGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IngestionQueueJobGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IngestionQueueJobGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IngestionQueueJobGroupByOutputType[P]>
            : GetScalarType<T[P], IngestionQueueJobGroupByOutputType[P]>
        }
      >
    >


  export type IngestionQueueJobSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    status?: boolean
    attemptCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    processedAt?: boolean
    nextAttemptAt?: boolean
    deadLetteredAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ingestionQueueJob"]>

  export type IngestionQueueJobSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    status?: boolean
    attemptCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    processedAt?: boolean
    nextAttemptAt?: boolean
    deadLetteredAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ingestionQueueJob"]>

  export type IngestionQueueJobSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    status?: boolean
    attemptCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    processedAt?: boolean
    nextAttemptAt?: boolean
    deadLetteredAt?: boolean
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ingestionQueueJob"]>

  export type IngestionQueueJobSelectScalar = {
    id?: boolean
    tenantId?: boolean
    eventType?: boolean
    eventKey?: boolean
    occurredAt?: boolean
    payloadJson?: boolean
    status?: boolean
    attemptCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    processedAt?: boolean
    nextAttemptAt?: boolean
    deadLetteredAt?: boolean
  }

  export type IngestionQueueJobOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "eventType" | "eventKey" | "occurredAt" | "payloadJson" | "status" | "attemptCount" | "lastError" | "createdAt" | "updatedAt" | "processedAt" | "nextAttemptAt" | "deadLetteredAt", ExtArgs["result"]["ingestionQueueJob"]>
  export type IngestionQueueJobInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type IngestionQueueJobIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }
  export type IngestionQueueJobIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | TenantDefaultArgs<ExtArgs>
  }

  export type $IngestionQueueJobPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IngestionQueueJob"
    objects: {
      tenant: Prisma.$TenantPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      eventType: string
      eventKey: string
      occurredAt: Date
      payloadJson: string
      status: string
      attemptCount: number
      lastError: string | null
      createdAt: Date
      updatedAt: Date
      processedAt: Date | null
      nextAttemptAt: Date
      deadLetteredAt: Date | null
    }, ExtArgs["result"]["ingestionQueueJob"]>
    composites: {}
  }

  type IngestionQueueJobGetPayload<S extends boolean | null | undefined | IngestionQueueJobDefaultArgs> = $Result.GetResult<Prisma.$IngestionQueueJobPayload, S>

  type IngestionQueueJobCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IngestionQueueJobFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IngestionQueueJobCountAggregateInputType | true
    }

  export interface IngestionQueueJobDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IngestionQueueJob'], meta: { name: 'IngestionQueueJob' } }
    /**
     * Find zero or one IngestionQueueJob that matches the filter.
     * @param {IngestionQueueJobFindUniqueArgs} args - Arguments to find a IngestionQueueJob
     * @example
     * // Get one IngestionQueueJob
     * const ingestionQueueJob = await prisma.ingestionQueueJob.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IngestionQueueJobFindUniqueArgs>(args: SelectSubset<T, IngestionQueueJobFindUniqueArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IngestionQueueJob that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IngestionQueueJobFindUniqueOrThrowArgs} args - Arguments to find a IngestionQueueJob
     * @example
     * // Get one IngestionQueueJob
     * const ingestionQueueJob = await prisma.ingestionQueueJob.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IngestionQueueJobFindUniqueOrThrowArgs>(args: SelectSubset<T, IngestionQueueJobFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IngestionQueueJob that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobFindFirstArgs} args - Arguments to find a IngestionQueueJob
     * @example
     * // Get one IngestionQueueJob
     * const ingestionQueueJob = await prisma.ingestionQueueJob.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IngestionQueueJobFindFirstArgs>(args?: SelectSubset<T, IngestionQueueJobFindFirstArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IngestionQueueJob that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobFindFirstOrThrowArgs} args - Arguments to find a IngestionQueueJob
     * @example
     * // Get one IngestionQueueJob
     * const ingestionQueueJob = await prisma.ingestionQueueJob.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IngestionQueueJobFindFirstOrThrowArgs>(args?: SelectSubset<T, IngestionQueueJobFindFirstOrThrowArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IngestionQueueJobs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IngestionQueueJobs
     * const ingestionQueueJobs = await prisma.ingestionQueueJob.findMany()
     * 
     * // Get first 10 IngestionQueueJobs
     * const ingestionQueueJobs = await prisma.ingestionQueueJob.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ingestionQueueJobWithIdOnly = await prisma.ingestionQueueJob.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IngestionQueueJobFindManyArgs>(args?: SelectSubset<T, IngestionQueueJobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IngestionQueueJob.
     * @param {IngestionQueueJobCreateArgs} args - Arguments to create a IngestionQueueJob.
     * @example
     * // Create one IngestionQueueJob
     * const IngestionQueueJob = await prisma.ingestionQueueJob.create({
     *   data: {
     *     // ... data to create a IngestionQueueJob
     *   }
     * })
     * 
     */
    create<T extends IngestionQueueJobCreateArgs>(args: SelectSubset<T, IngestionQueueJobCreateArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IngestionQueueJobs.
     * @param {IngestionQueueJobCreateManyArgs} args - Arguments to create many IngestionQueueJobs.
     * @example
     * // Create many IngestionQueueJobs
     * const ingestionQueueJob = await prisma.ingestionQueueJob.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IngestionQueueJobCreateManyArgs>(args?: SelectSubset<T, IngestionQueueJobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IngestionQueueJobs and returns the data saved in the database.
     * @param {IngestionQueueJobCreateManyAndReturnArgs} args - Arguments to create many IngestionQueueJobs.
     * @example
     * // Create many IngestionQueueJobs
     * const ingestionQueueJob = await prisma.ingestionQueueJob.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IngestionQueueJobs and only return the `id`
     * const ingestionQueueJobWithIdOnly = await prisma.ingestionQueueJob.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IngestionQueueJobCreateManyAndReturnArgs>(args?: SelectSubset<T, IngestionQueueJobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IngestionQueueJob.
     * @param {IngestionQueueJobDeleteArgs} args - Arguments to delete one IngestionQueueJob.
     * @example
     * // Delete one IngestionQueueJob
     * const IngestionQueueJob = await prisma.ingestionQueueJob.delete({
     *   where: {
     *     // ... filter to delete one IngestionQueueJob
     *   }
     * })
     * 
     */
    delete<T extends IngestionQueueJobDeleteArgs>(args: SelectSubset<T, IngestionQueueJobDeleteArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IngestionQueueJob.
     * @param {IngestionQueueJobUpdateArgs} args - Arguments to update one IngestionQueueJob.
     * @example
     * // Update one IngestionQueueJob
     * const ingestionQueueJob = await prisma.ingestionQueueJob.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IngestionQueueJobUpdateArgs>(args: SelectSubset<T, IngestionQueueJobUpdateArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IngestionQueueJobs.
     * @param {IngestionQueueJobDeleteManyArgs} args - Arguments to filter IngestionQueueJobs to delete.
     * @example
     * // Delete a few IngestionQueueJobs
     * const { count } = await prisma.ingestionQueueJob.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IngestionQueueJobDeleteManyArgs>(args?: SelectSubset<T, IngestionQueueJobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IngestionQueueJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IngestionQueueJobs
     * const ingestionQueueJob = await prisma.ingestionQueueJob.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IngestionQueueJobUpdateManyArgs>(args: SelectSubset<T, IngestionQueueJobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IngestionQueueJobs and returns the data updated in the database.
     * @param {IngestionQueueJobUpdateManyAndReturnArgs} args - Arguments to update many IngestionQueueJobs.
     * @example
     * // Update many IngestionQueueJobs
     * const ingestionQueueJob = await prisma.ingestionQueueJob.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IngestionQueueJobs and only return the `id`
     * const ingestionQueueJobWithIdOnly = await prisma.ingestionQueueJob.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IngestionQueueJobUpdateManyAndReturnArgs>(args: SelectSubset<T, IngestionQueueJobUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IngestionQueueJob.
     * @param {IngestionQueueJobUpsertArgs} args - Arguments to update or create a IngestionQueueJob.
     * @example
     * // Update or create a IngestionQueueJob
     * const ingestionQueueJob = await prisma.ingestionQueueJob.upsert({
     *   create: {
     *     // ... data to create a IngestionQueueJob
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IngestionQueueJob we want to update
     *   }
     * })
     */
    upsert<T extends IngestionQueueJobUpsertArgs>(args: SelectSubset<T, IngestionQueueJobUpsertArgs<ExtArgs>>): Prisma__IngestionQueueJobClient<$Result.GetResult<Prisma.$IngestionQueueJobPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IngestionQueueJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobCountArgs} args - Arguments to filter IngestionQueueJobs to count.
     * @example
     * // Count the number of IngestionQueueJobs
     * const count = await prisma.ingestionQueueJob.count({
     *   where: {
     *     // ... the filter for the IngestionQueueJobs we want to count
     *   }
     * })
    **/
    count<T extends IngestionQueueJobCountArgs>(
      args?: Subset<T, IngestionQueueJobCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IngestionQueueJobCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IngestionQueueJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IngestionQueueJobAggregateArgs>(args: Subset<T, IngestionQueueJobAggregateArgs>): Prisma.PrismaPromise<GetIngestionQueueJobAggregateType<T>>

    /**
     * Group by IngestionQueueJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IngestionQueueJobGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IngestionQueueJobGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IngestionQueueJobGroupByArgs['orderBy'] }
        : { orderBy?: IngestionQueueJobGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IngestionQueueJobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIngestionQueueJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IngestionQueueJob model
   */
  readonly fields: IngestionQueueJobFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IngestionQueueJob.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IngestionQueueJobClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends TenantDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TenantDefaultArgs<ExtArgs>>): Prisma__TenantClient<$Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IngestionQueueJob model
   */
  interface IngestionQueueJobFieldRefs {
    readonly id: FieldRef<"IngestionQueueJob", 'String'>
    readonly tenantId: FieldRef<"IngestionQueueJob", 'String'>
    readonly eventType: FieldRef<"IngestionQueueJob", 'String'>
    readonly eventKey: FieldRef<"IngestionQueueJob", 'String'>
    readonly occurredAt: FieldRef<"IngestionQueueJob", 'DateTime'>
    readonly payloadJson: FieldRef<"IngestionQueueJob", 'String'>
    readonly status: FieldRef<"IngestionQueueJob", 'String'>
    readonly attemptCount: FieldRef<"IngestionQueueJob", 'Int'>
    readonly lastError: FieldRef<"IngestionQueueJob", 'String'>
    readonly createdAt: FieldRef<"IngestionQueueJob", 'DateTime'>
    readonly updatedAt: FieldRef<"IngestionQueueJob", 'DateTime'>
    readonly processedAt: FieldRef<"IngestionQueueJob", 'DateTime'>
    readonly nextAttemptAt: FieldRef<"IngestionQueueJob", 'DateTime'>
    readonly deadLetteredAt: FieldRef<"IngestionQueueJob", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IngestionQueueJob findUnique
   */
  export type IngestionQueueJobFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * Filter, which IngestionQueueJob to fetch.
     */
    where: IngestionQueueJobWhereUniqueInput
  }

  /**
   * IngestionQueueJob findUniqueOrThrow
   */
  export type IngestionQueueJobFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * Filter, which IngestionQueueJob to fetch.
     */
    where: IngestionQueueJobWhereUniqueInput
  }

  /**
   * IngestionQueueJob findFirst
   */
  export type IngestionQueueJobFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * Filter, which IngestionQueueJob to fetch.
     */
    where?: IngestionQueueJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestionQueueJobs to fetch.
     */
    orderBy?: IngestionQueueJobOrderByWithRelationInput | IngestionQueueJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IngestionQueueJobs.
     */
    cursor?: IngestionQueueJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestionQueueJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestionQueueJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IngestionQueueJobs.
     */
    distinct?: IngestionQueueJobScalarFieldEnum | IngestionQueueJobScalarFieldEnum[]
  }

  /**
   * IngestionQueueJob findFirstOrThrow
   */
  export type IngestionQueueJobFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * Filter, which IngestionQueueJob to fetch.
     */
    where?: IngestionQueueJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestionQueueJobs to fetch.
     */
    orderBy?: IngestionQueueJobOrderByWithRelationInput | IngestionQueueJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IngestionQueueJobs.
     */
    cursor?: IngestionQueueJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestionQueueJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestionQueueJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IngestionQueueJobs.
     */
    distinct?: IngestionQueueJobScalarFieldEnum | IngestionQueueJobScalarFieldEnum[]
  }

  /**
   * IngestionQueueJob findMany
   */
  export type IngestionQueueJobFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * Filter, which IngestionQueueJobs to fetch.
     */
    where?: IngestionQueueJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IngestionQueueJobs to fetch.
     */
    orderBy?: IngestionQueueJobOrderByWithRelationInput | IngestionQueueJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IngestionQueueJobs.
     */
    cursor?: IngestionQueueJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IngestionQueueJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IngestionQueueJobs.
     */
    skip?: number
    distinct?: IngestionQueueJobScalarFieldEnum | IngestionQueueJobScalarFieldEnum[]
  }

  /**
   * IngestionQueueJob create
   */
  export type IngestionQueueJobCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * The data needed to create a IngestionQueueJob.
     */
    data: XOR<IngestionQueueJobCreateInput, IngestionQueueJobUncheckedCreateInput>
  }

  /**
   * IngestionQueueJob createMany
   */
  export type IngestionQueueJobCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IngestionQueueJobs.
     */
    data: IngestionQueueJobCreateManyInput | IngestionQueueJobCreateManyInput[]
  }

  /**
   * IngestionQueueJob createManyAndReturn
   */
  export type IngestionQueueJobCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * The data used to create many IngestionQueueJobs.
     */
    data: IngestionQueueJobCreateManyInput | IngestionQueueJobCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IngestionQueueJob update
   */
  export type IngestionQueueJobUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * The data needed to update a IngestionQueueJob.
     */
    data: XOR<IngestionQueueJobUpdateInput, IngestionQueueJobUncheckedUpdateInput>
    /**
     * Choose, which IngestionQueueJob to update.
     */
    where: IngestionQueueJobWhereUniqueInput
  }

  /**
   * IngestionQueueJob updateMany
   */
  export type IngestionQueueJobUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IngestionQueueJobs.
     */
    data: XOR<IngestionQueueJobUpdateManyMutationInput, IngestionQueueJobUncheckedUpdateManyInput>
    /**
     * Filter which IngestionQueueJobs to update
     */
    where?: IngestionQueueJobWhereInput
    /**
     * Limit how many IngestionQueueJobs to update.
     */
    limit?: number
  }

  /**
   * IngestionQueueJob updateManyAndReturn
   */
  export type IngestionQueueJobUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * The data used to update IngestionQueueJobs.
     */
    data: XOR<IngestionQueueJobUpdateManyMutationInput, IngestionQueueJobUncheckedUpdateManyInput>
    /**
     * Filter which IngestionQueueJobs to update
     */
    where?: IngestionQueueJobWhereInput
    /**
     * Limit how many IngestionQueueJobs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IngestionQueueJob upsert
   */
  export type IngestionQueueJobUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * The filter to search for the IngestionQueueJob to update in case it exists.
     */
    where: IngestionQueueJobWhereUniqueInput
    /**
     * In case the IngestionQueueJob found by the `where` argument doesn't exist, create a new IngestionQueueJob with this data.
     */
    create: XOR<IngestionQueueJobCreateInput, IngestionQueueJobUncheckedCreateInput>
    /**
     * In case the IngestionQueueJob was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IngestionQueueJobUpdateInput, IngestionQueueJobUncheckedUpdateInput>
  }

  /**
   * IngestionQueueJob delete
   */
  export type IngestionQueueJobDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
    /**
     * Filter which IngestionQueueJob to delete.
     */
    where: IngestionQueueJobWhereUniqueInput
  }

  /**
   * IngestionQueueJob deleteMany
   */
  export type IngestionQueueJobDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IngestionQueueJobs to delete
     */
    where?: IngestionQueueJobWhereInput
    /**
     * Limit how many IngestionQueueJobs to delete.
     */
    limit?: number
  }

  /**
   * IngestionQueueJob without action
   */
  export type IngestionQueueJobDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IngestionQueueJob
     */
    select?: IngestionQueueJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IngestionQueueJob
     */
    omit?: IngestionQueueJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IngestionQueueJobInclude<ExtArgs> | null
  }


  /**
   * Model AdminAuditEvent
   */

  export type AggregateAdminAuditEvent = {
    _count: AdminAuditEventCountAggregateOutputType | null
    _min: AdminAuditEventMinAggregateOutputType | null
    _max: AdminAuditEventMaxAggregateOutputType | null
  }

  export type AdminAuditEventMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    domainId: string | null
    action: string | null
    status: string | null
    actorId: string | null
    actorRole: string | null
    error: string | null
    metadataJson: string | null
    createdAt: Date | null
  }

  export type AdminAuditEventMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    domainId: string | null
    action: string | null
    status: string | null
    actorId: string | null
    actorRole: string | null
    error: string | null
    metadataJson: string | null
    createdAt: Date | null
  }

  export type AdminAuditEventCountAggregateOutputType = {
    id: number
    tenantId: number
    domainId: number
    action: number
    status: number
    actorId: number
    actorRole: number
    error: number
    metadataJson: number
    createdAt: number
    _all: number
  }


  export type AdminAuditEventMinAggregateInputType = {
    id?: true
    tenantId?: true
    domainId?: true
    action?: true
    status?: true
    actorId?: true
    actorRole?: true
    error?: true
    metadataJson?: true
    createdAt?: true
  }

  export type AdminAuditEventMaxAggregateInputType = {
    id?: true
    tenantId?: true
    domainId?: true
    action?: true
    status?: true
    actorId?: true
    actorRole?: true
    error?: true
    metadataJson?: true
    createdAt?: true
  }

  export type AdminAuditEventCountAggregateInputType = {
    id?: true
    tenantId?: true
    domainId?: true
    action?: true
    status?: true
    actorId?: true
    actorRole?: true
    error?: true
    metadataJson?: true
    createdAt?: true
    _all?: true
  }

  export type AdminAuditEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminAuditEvent to aggregate.
     */
    where?: AdminAuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminAuditEvents to fetch.
     */
    orderBy?: AdminAuditEventOrderByWithRelationInput | AdminAuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AdminAuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminAuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminAuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AdminAuditEvents
    **/
    _count?: true | AdminAuditEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AdminAuditEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AdminAuditEventMaxAggregateInputType
  }

  export type GetAdminAuditEventAggregateType<T extends AdminAuditEventAggregateArgs> = {
        [P in keyof T & keyof AggregateAdminAuditEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAdminAuditEvent[P]>
      : GetScalarType<T[P], AggregateAdminAuditEvent[P]>
  }




  export type AdminAuditEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminAuditEventWhereInput
    orderBy?: AdminAuditEventOrderByWithAggregationInput | AdminAuditEventOrderByWithAggregationInput[]
    by: AdminAuditEventScalarFieldEnum[] | AdminAuditEventScalarFieldEnum
    having?: AdminAuditEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AdminAuditEventCountAggregateInputType | true
    _min?: AdminAuditEventMinAggregateInputType
    _max?: AdminAuditEventMaxAggregateInputType
  }

  export type AdminAuditEventGroupByOutputType = {
    id: string
    tenantId: string | null
    domainId: string | null
    action: string
    status: string
    actorId: string | null
    actorRole: string
    error: string | null
    metadataJson: string | null
    createdAt: Date
    _count: AdminAuditEventCountAggregateOutputType | null
    _min: AdminAuditEventMinAggregateOutputType | null
    _max: AdminAuditEventMaxAggregateOutputType | null
  }

  type GetAdminAuditEventGroupByPayload<T extends AdminAuditEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AdminAuditEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AdminAuditEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AdminAuditEventGroupByOutputType[P]>
            : GetScalarType<T[P], AdminAuditEventGroupByOutputType[P]>
        }
      >
    >


  export type AdminAuditEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    domainId?: boolean
    action?: boolean
    status?: boolean
    actorId?: boolean
    actorRole?: boolean
    error?: boolean
    metadataJson?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["adminAuditEvent"]>

  export type AdminAuditEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    domainId?: boolean
    action?: boolean
    status?: boolean
    actorId?: boolean
    actorRole?: boolean
    error?: boolean
    metadataJson?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["adminAuditEvent"]>

  export type AdminAuditEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    domainId?: boolean
    action?: boolean
    status?: boolean
    actorId?: boolean
    actorRole?: boolean
    error?: boolean
    metadataJson?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["adminAuditEvent"]>

  export type AdminAuditEventSelectScalar = {
    id?: boolean
    tenantId?: boolean
    domainId?: boolean
    action?: boolean
    status?: boolean
    actorId?: boolean
    actorRole?: boolean
    error?: boolean
    metadataJson?: boolean
    createdAt?: boolean
  }

  export type AdminAuditEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "domainId" | "action" | "status" | "actorId" | "actorRole" | "error" | "metadataJson" | "createdAt", ExtArgs["result"]["adminAuditEvent"]>

  export type $AdminAuditEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AdminAuditEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string | null
      domainId: string | null
      action: string
      status: string
      actorId: string | null
      actorRole: string
      error: string | null
      metadataJson: string | null
      createdAt: Date
    }, ExtArgs["result"]["adminAuditEvent"]>
    composites: {}
  }

  type AdminAuditEventGetPayload<S extends boolean | null | undefined | AdminAuditEventDefaultArgs> = $Result.GetResult<Prisma.$AdminAuditEventPayload, S>

  type AdminAuditEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AdminAuditEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AdminAuditEventCountAggregateInputType | true
    }

  export interface AdminAuditEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AdminAuditEvent'], meta: { name: 'AdminAuditEvent' } }
    /**
     * Find zero or one AdminAuditEvent that matches the filter.
     * @param {AdminAuditEventFindUniqueArgs} args - Arguments to find a AdminAuditEvent
     * @example
     * // Get one AdminAuditEvent
     * const adminAuditEvent = await prisma.adminAuditEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdminAuditEventFindUniqueArgs>(args: SelectSubset<T, AdminAuditEventFindUniqueArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AdminAuditEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdminAuditEventFindUniqueOrThrowArgs} args - Arguments to find a AdminAuditEvent
     * @example
     * // Get one AdminAuditEvent
     * const adminAuditEvent = await prisma.adminAuditEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdminAuditEventFindUniqueOrThrowArgs>(args: SelectSubset<T, AdminAuditEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminAuditEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventFindFirstArgs} args - Arguments to find a AdminAuditEvent
     * @example
     * // Get one AdminAuditEvent
     * const adminAuditEvent = await prisma.adminAuditEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdminAuditEventFindFirstArgs>(args?: SelectSubset<T, AdminAuditEventFindFirstArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminAuditEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventFindFirstOrThrowArgs} args - Arguments to find a AdminAuditEvent
     * @example
     * // Get one AdminAuditEvent
     * const adminAuditEvent = await prisma.adminAuditEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdminAuditEventFindFirstOrThrowArgs>(args?: SelectSubset<T, AdminAuditEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AdminAuditEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AdminAuditEvents
     * const adminAuditEvents = await prisma.adminAuditEvent.findMany()
     * 
     * // Get first 10 AdminAuditEvents
     * const adminAuditEvents = await prisma.adminAuditEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const adminAuditEventWithIdOnly = await prisma.adminAuditEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AdminAuditEventFindManyArgs>(args?: SelectSubset<T, AdminAuditEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AdminAuditEvent.
     * @param {AdminAuditEventCreateArgs} args - Arguments to create a AdminAuditEvent.
     * @example
     * // Create one AdminAuditEvent
     * const AdminAuditEvent = await prisma.adminAuditEvent.create({
     *   data: {
     *     // ... data to create a AdminAuditEvent
     *   }
     * })
     * 
     */
    create<T extends AdminAuditEventCreateArgs>(args: SelectSubset<T, AdminAuditEventCreateArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AdminAuditEvents.
     * @param {AdminAuditEventCreateManyArgs} args - Arguments to create many AdminAuditEvents.
     * @example
     * // Create many AdminAuditEvents
     * const adminAuditEvent = await prisma.adminAuditEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AdminAuditEventCreateManyArgs>(args?: SelectSubset<T, AdminAuditEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AdminAuditEvents and returns the data saved in the database.
     * @param {AdminAuditEventCreateManyAndReturnArgs} args - Arguments to create many AdminAuditEvents.
     * @example
     * // Create many AdminAuditEvents
     * const adminAuditEvent = await prisma.adminAuditEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AdminAuditEvents and only return the `id`
     * const adminAuditEventWithIdOnly = await prisma.adminAuditEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AdminAuditEventCreateManyAndReturnArgs>(args?: SelectSubset<T, AdminAuditEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AdminAuditEvent.
     * @param {AdminAuditEventDeleteArgs} args - Arguments to delete one AdminAuditEvent.
     * @example
     * // Delete one AdminAuditEvent
     * const AdminAuditEvent = await prisma.adminAuditEvent.delete({
     *   where: {
     *     // ... filter to delete one AdminAuditEvent
     *   }
     * })
     * 
     */
    delete<T extends AdminAuditEventDeleteArgs>(args: SelectSubset<T, AdminAuditEventDeleteArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AdminAuditEvent.
     * @param {AdminAuditEventUpdateArgs} args - Arguments to update one AdminAuditEvent.
     * @example
     * // Update one AdminAuditEvent
     * const adminAuditEvent = await prisma.adminAuditEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AdminAuditEventUpdateArgs>(args: SelectSubset<T, AdminAuditEventUpdateArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AdminAuditEvents.
     * @param {AdminAuditEventDeleteManyArgs} args - Arguments to filter AdminAuditEvents to delete.
     * @example
     * // Delete a few AdminAuditEvents
     * const { count } = await prisma.adminAuditEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AdminAuditEventDeleteManyArgs>(args?: SelectSubset<T, AdminAuditEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminAuditEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AdminAuditEvents
     * const adminAuditEvent = await prisma.adminAuditEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AdminAuditEventUpdateManyArgs>(args: SelectSubset<T, AdminAuditEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminAuditEvents and returns the data updated in the database.
     * @param {AdminAuditEventUpdateManyAndReturnArgs} args - Arguments to update many AdminAuditEvents.
     * @example
     * // Update many AdminAuditEvents
     * const adminAuditEvent = await prisma.adminAuditEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AdminAuditEvents and only return the `id`
     * const adminAuditEventWithIdOnly = await prisma.adminAuditEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AdminAuditEventUpdateManyAndReturnArgs>(args: SelectSubset<T, AdminAuditEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AdminAuditEvent.
     * @param {AdminAuditEventUpsertArgs} args - Arguments to update or create a AdminAuditEvent.
     * @example
     * // Update or create a AdminAuditEvent
     * const adminAuditEvent = await prisma.adminAuditEvent.upsert({
     *   create: {
     *     // ... data to create a AdminAuditEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AdminAuditEvent we want to update
     *   }
     * })
     */
    upsert<T extends AdminAuditEventUpsertArgs>(args: SelectSubset<T, AdminAuditEventUpsertArgs<ExtArgs>>): Prisma__AdminAuditEventClient<$Result.GetResult<Prisma.$AdminAuditEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AdminAuditEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventCountArgs} args - Arguments to filter AdminAuditEvents to count.
     * @example
     * // Count the number of AdminAuditEvents
     * const count = await prisma.adminAuditEvent.count({
     *   where: {
     *     // ... the filter for the AdminAuditEvents we want to count
     *   }
     * })
    **/
    count<T extends AdminAuditEventCountArgs>(
      args?: Subset<T, AdminAuditEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AdminAuditEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AdminAuditEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AdminAuditEventAggregateArgs>(args: Subset<T, AdminAuditEventAggregateArgs>): Prisma.PrismaPromise<GetAdminAuditEventAggregateType<T>>

    /**
     * Group by AdminAuditEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAuditEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AdminAuditEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AdminAuditEventGroupByArgs['orderBy'] }
        : { orderBy?: AdminAuditEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AdminAuditEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminAuditEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AdminAuditEvent model
   */
  readonly fields: AdminAuditEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AdminAuditEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AdminAuditEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AdminAuditEvent model
   */
  interface AdminAuditEventFieldRefs {
    readonly id: FieldRef<"AdminAuditEvent", 'String'>
    readonly tenantId: FieldRef<"AdminAuditEvent", 'String'>
    readonly domainId: FieldRef<"AdminAuditEvent", 'String'>
    readonly action: FieldRef<"AdminAuditEvent", 'String'>
    readonly status: FieldRef<"AdminAuditEvent", 'String'>
    readonly actorId: FieldRef<"AdminAuditEvent", 'String'>
    readonly actorRole: FieldRef<"AdminAuditEvent", 'String'>
    readonly error: FieldRef<"AdminAuditEvent", 'String'>
    readonly metadataJson: FieldRef<"AdminAuditEvent", 'String'>
    readonly createdAt: FieldRef<"AdminAuditEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AdminAuditEvent findUnique
   */
  export type AdminAuditEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AdminAuditEvent to fetch.
     */
    where: AdminAuditEventWhereUniqueInput
  }

  /**
   * AdminAuditEvent findUniqueOrThrow
   */
  export type AdminAuditEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AdminAuditEvent to fetch.
     */
    where: AdminAuditEventWhereUniqueInput
  }

  /**
   * AdminAuditEvent findFirst
   */
  export type AdminAuditEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AdminAuditEvent to fetch.
     */
    where?: AdminAuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminAuditEvents to fetch.
     */
    orderBy?: AdminAuditEventOrderByWithRelationInput | AdminAuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminAuditEvents.
     */
    cursor?: AdminAuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminAuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminAuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminAuditEvents.
     */
    distinct?: AdminAuditEventScalarFieldEnum | AdminAuditEventScalarFieldEnum[]
  }

  /**
   * AdminAuditEvent findFirstOrThrow
   */
  export type AdminAuditEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AdminAuditEvent to fetch.
     */
    where?: AdminAuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminAuditEvents to fetch.
     */
    orderBy?: AdminAuditEventOrderByWithRelationInput | AdminAuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminAuditEvents.
     */
    cursor?: AdminAuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminAuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminAuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminAuditEvents.
     */
    distinct?: AdminAuditEventScalarFieldEnum | AdminAuditEventScalarFieldEnum[]
  }

  /**
   * AdminAuditEvent findMany
   */
  export type AdminAuditEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AdminAuditEvents to fetch.
     */
    where?: AdminAuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminAuditEvents to fetch.
     */
    orderBy?: AdminAuditEventOrderByWithRelationInput | AdminAuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AdminAuditEvents.
     */
    cursor?: AdminAuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminAuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminAuditEvents.
     */
    skip?: number
    distinct?: AdminAuditEventScalarFieldEnum | AdminAuditEventScalarFieldEnum[]
  }

  /**
   * AdminAuditEvent create
   */
  export type AdminAuditEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * The data needed to create a AdminAuditEvent.
     */
    data: XOR<AdminAuditEventCreateInput, AdminAuditEventUncheckedCreateInput>
  }

  /**
   * AdminAuditEvent createMany
   */
  export type AdminAuditEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AdminAuditEvents.
     */
    data: AdminAuditEventCreateManyInput | AdminAuditEventCreateManyInput[]
  }

  /**
   * AdminAuditEvent createManyAndReturn
   */
  export type AdminAuditEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * The data used to create many AdminAuditEvents.
     */
    data: AdminAuditEventCreateManyInput | AdminAuditEventCreateManyInput[]
  }

  /**
   * AdminAuditEvent update
   */
  export type AdminAuditEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * The data needed to update a AdminAuditEvent.
     */
    data: XOR<AdminAuditEventUpdateInput, AdminAuditEventUncheckedUpdateInput>
    /**
     * Choose, which AdminAuditEvent to update.
     */
    where: AdminAuditEventWhereUniqueInput
  }

  /**
   * AdminAuditEvent updateMany
   */
  export type AdminAuditEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AdminAuditEvents.
     */
    data: XOR<AdminAuditEventUpdateManyMutationInput, AdminAuditEventUncheckedUpdateManyInput>
    /**
     * Filter which AdminAuditEvents to update
     */
    where?: AdminAuditEventWhereInput
    /**
     * Limit how many AdminAuditEvents to update.
     */
    limit?: number
  }

  /**
   * AdminAuditEvent updateManyAndReturn
   */
  export type AdminAuditEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * The data used to update AdminAuditEvents.
     */
    data: XOR<AdminAuditEventUpdateManyMutationInput, AdminAuditEventUncheckedUpdateManyInput>
    /**
     * Filter which AdminAuditEvents to update
     */
    where?: AdminAuditEventWhereInput
    /**
     * Limit how many AdminAuditEvents to update.
     */
    limit?: number
  }

  /**
   * AdminAuditEvent upsert
   */
  export type AdminAuditEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * The filter to search for the AdminAuditEvent to update in case it exists.
     */
    where: AdminAuditEventWhereUniqueInput
    /**
     * In case the AdminAuditEvent found by the `where` argument doesn't exist, create a new AdminAuditEvent with this data.
     */
    create: XOR<AdminAuditEventCreateInput, AdminAuditEventUncheckedCreateInput>
    /**
     * In case the AdminAuditEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AdminAuditEventUpdateInput, AdminAuditEventUncheckedUpdateInput>
  }

  /**
   * AdminAuditEvent delete
   */
  export type AdminAuditEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
    /**
     * Filter which AdminAuditEvent to delete.
     */
    where: AdminAuditEventWhereUniqueInput
  }

  /**
   * AdminAuditEvent deleteMany
   */
  export type AdminAuditEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminAuditEvents to delete
     */
    where?: AdminAuditEventWhereInput
    /**
     * Limit how many AdminAuditEvents to delete.
     */
    limit?: number
  }

  /**
   * AdminAuditEvent without action
   */
  export type AdminAuditEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminAuditEvent
     */
    select?: AdminAuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminAuditEvent
     */
    omit?: AdminAuditEventOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TenantScalarFieldEnum: {
    id: 'id',
    slug: 'slug',
    name: 'name',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TenantScalarFieldEnum = (typeof TenantScalarFieldEnum)[keyof typeof TenantScalarFieldEnum]


  export const TenantDomainScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    hostname: 'hostname',
    hostnameNormalized: 'hostnameNormalized',
    status: 'status',
    isPrimary: 'isPrimary',
    isVerified: 'isVerified',
    verifiedAt: 'verifiedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TenantDomainScalarFieldEnum = (typeof TenantDomainScalarFieldEnum)[keyof typeof TenantDomainScalarFieldEnum]


  export const WebsiteConfigScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WebsiteConfigScalarFieldEnum = (typeof WebsiteConfigScalarFieldEnum)[keyof typeof WebsiteConfigScalarFieldEnum]


  export const TenantControlSettingsScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    status: 'status',
    planCode: 'planCode',
    featureFlagsJson: 'featureFlagsJson',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TenantControlSettingsScalarFieldEnum = (typeof TenantControlSettingsScalarFieldEnum)[keyof typeof TenantControlSettingsScalarFieldEnum]


  export const TenantControlActorScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    actorId: 'actorId',
    displayName: 'displayName',
    email: 'email',
    role: 'role',
    permissionsJson: 'permissionsJson',
    supportSessionActive: 'supportSessionActive',
    supportSessionStartedAt: 'supportSessionStartedAt',
    supportSessionExpiresAt: 'supportSessionExpiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TenantControlActorScalarFieldEnum = (typeof TenantControlActorScalarFieldEnum)[keyof typeof TenantControlActorScalarFieldEnum]


  export const ModuleConfigScalarFieldEnum: {
    id: 'id',
    websiteConfigId: 'websiteConfigId',
    tenantId: 'tenantId',
    moduleKey: 'moduleKey',
    enabled: 'enabled',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ModuleConfigScalarFieldEnum = (typeof ModuleConfigScalarFieldEnum)[keyof typeof ModuleConfigScalarFieldEnum]


  export const ContactScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    fullName: 'fullName',
    email: 'email',
    emailNormalized: 'emailNormalized',
    phone: 'phone',
    phoneNormalized: 'phoneNormalized',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContactScalarFieldEnum = (typeof ContactScalarFieldEnum)[keyof typeof ContactScalarFieldEnum]


  export const LeadScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    contactId: 'contactId',
    status: 'status',
    leadType: 'leadType',
    source: 'source',
    timeframe: 'timeframe',
    notes: 'notes',
    listingId: 'listingId',
    listingUrl: 'listingUrl',
    listingAddress: 'listingAddress',
    propertyType: 'propertyType',
    beds: 'beds',
    baths: 'baths',
    sqft: 'sqft',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LeadScalarFieldEnum = (typeof LeadScalarFieldEnum)[keyof typeof LeadScalarFieldEnum]


  export const ActivityScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    contactId: 'contactId',
    leadId: 'leadId',
    activityType: 'activityType',
    occurredAt: 'occurredAt',
    summary: 'summary',
    metadataJson: 'metadataJson',
    createdAt: 'createdAt'
  };

  export type ActivityScalarFieldEnum = (typeof ActivityScalarFieldEnum)[keyof typeof ActivityScalarFieldEnum]


  export const IngestedEventScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    eventType: 'eventType',
    eventKey: 'eventKey',
    occurredAt: 'occurredAt',
    payloadJson: 'payloadJson',
    processedAt: 'processedAt',
    createdAt: 'createdAt'
  };

  export type IngestedEventScalarFieldEnum = (typeof IngestedEventScalarFieldEnum)[keyof typeof IngestedEventScalarFieldEnum]


  export const IngestionQueueJobScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    eventType: 'eventType',
    eventKey: 'eventKey',
    occurredAt: 'occurredAt',
    payloadJson: 'payloadJson',
    status: 'status',
    attemptCount: 'attemptCount',
    lastError: 'lastError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    processedAt: 'processedAt',
    nextAttemptAt: 'nextAttemptAt',
    deadLetteredAt: 'deadLetteredAt'
  };

  export type IngestionQueueJobScalarFieldEnum = (typeof IngestionQueueJobScalarFieldEnum)[keyof typeof IngestionQueueJobScalarFieldEnum]


  export const AdminAuditEventScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    domainId: 'domainId',
    action: 'action',
    status: 'status',
    actorId: 'actorId',
    actorRole: 'actorRole',
    error: 'error',
    metadataJson: 'metadataJson',
    createdAt: 'createdAt'
  };

  export type AdminAuditEventScalarFieldEnum = (typeof AdminAuditEventScalarFieldEnum)[keyof typeof AdminAuditEventScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type TenantWhereInput = {
    AND?: TenantWhereInput | TenantWhereInput[]
    OR?: TenantWhereInput[]
    NOT?: TenantWhereInput | TenantWhereInput[]
    id?: StringFilter<"Tenant"> | string
    slug?: StringFilter<"Tenant"> | string
    name?: StringFilter<"Tenant"> | string
    status?: StringFilter<"Tenant"> | string
    createdAt?: DateTimeFilter<"Tenant"> | Date | string
    updatedAt?: DateTimeFilter<"Tenant"> | Date | string
    domains?: TenantDomainListRelationFilter
    websiteConfig?: XOR<WebsiteConfigNullableScalarRelationFilter, WebsiteConfigWhereInput> | null
    controlSettings?: XOR<TenantControlSettingsNullableScalarRelationFilter, TenantControlSettingsWhereInput> | null
    controlActors?: TenantControlActorListRelationFilter
    contacts?: ContactListRelationFilter
    leads?: LeadListRelationFilter
    activities?: ActivityListRelationFilter
    ingestedEvents?: IngestedEventListRelationFilter
    ingestionQueueJobs?: IngestionQueueJobListRelationFilter
  }

  export type TenantOrderByWithRelationInput = {
    id?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    domains?: TenantDomainOrderByRelationAggregateInput
    websiteConfig?: WebsiteConfigOrderByWithRelationInput
    controlSettings?: TenantControlSettingsOrderByWithRelationInput
    controlActors?: TenantControlActorOrderByRelationAggregateInput
    contacts?: ContactOrderByRelationAggregateInput
    leads?: LeadOrderByRelationAggregateInput
    activities?: ActivityOrderByRelationAggregateInput
    ingestedEvents?: IngestedEventOrderByRelationAggregateInput
    ingestionQueueJobs?: IngestionQueueJobOrderByRelationAggregateInput
  }

  export type TenantWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: TenantWhereInput | TenantWhereInput[]
    OR?: TenantWhereInput[]
    NOT?: TenantWhereInput | TenantWhereInput[]
    name?: StringFilter<"Tenant"> | string
    status?: StringFilter<"Tenant"> | string
    createdAt?: DateTimeFilter<"Tenant"> | Date | string
    updatedAt?: DateTimeFilter<"Tenant"> | Date | string
    domains?: TenantDomainListRelationFilter
    websiteConfig?: XOR<WebsiteConfigNullableScalarRelationFilter, WebsiteConfigWhereInput> | null
    controlSettings?: XOR<TenantControlSettingsNullableScalarRelationFilter, TenantControlSettingsWhereInput> | null
    controlActors?: TenantControlActorListRelationFilter
    contacts?: ContactListRelationFilter
    leads?: LeadListRelationFilter
    activities?: ActivityListRelationFilter
    ingestedEvents?: IngestedEventListRelationFilter
    ingestionQueueJobs?: IngestionQueueJobListRelationFilter
  }, "id" | "slug">

  export type TenantOrderByWithAggregationInput = {
    id?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TenantCountOrderByAggregateInput
    _max?: TenantMaxOrderByAggregateInput
    _min?: TenantMinOrderByAggregateInput
  }

  export type TenantScalarWhereWithAggregatesInput = {
    AND?: TenantScalarWhereWithAggregatesInput | TenantScalarWhereWithAggregatesInput[]
    OR?: TenantScalarWhereWithAggregatesInput[]
    NOT?: TenantScalarWhereWithAggregatesInput | TenantScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Tenant"> | string
    slug?: StringWithAggregatesFilter<"Tenant"> | string
    name?: StringWithAggregatesFilter<"Tenant"> | string
    status?: StringWithAggregatesFilter<"Tenant"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Tenant"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Tenant"> | Date | string
  }

  export type TenantDomainWhereInput = {
    AND?: TenantDomainWhereInput | TenantDomainWhereInput[]
    OR?: TenantDomainWhereInput[]
    NOT?: TenantDomainWhereInput | TenantDomainWhereInput[]
    id?: StringFilter<"TenantDomain"> | string
    tenantId?: StringFilter<"TenantDomain"> | string
    hostname?: StringFilter<"TenantDomain"> | string
    hostnameNormalized?: StringFilter<"TenantDomain"> | string
    status?: StringFilter<"TenantDomain"> | string
    isPrimary?: BoolFilter<"TenantDomain"> | boolean
    isVerified?: BoolFilter<"TenantDomain"> | boolean
    verifiedAt?: DateTimeNullableFilter<"TenantDomain"> | Date | string | null
    createdAt?: DateTimeFilter<"TenantDomain"> | Date | string
    updatedAt?: DateTimeFilter<"TenantDomain"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }

  export type TenantDomainOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    hostname?: SortOrder
    hostnameNormalized?: SortOrder
    status?: SortOrder
    isPrimary?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
  }

  export type TenantDomainWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    hostnameNormalized?: string
    AND?: TenantDomainWhereInput | TenantDomainWhereInput[]
    OR?: TenantDomainWhereInput[]
    NOT?: TenantDomainWhereInput | TenantDomainWhereInput[]
    tenantId?: StringFilter<"TenantDomain"> | string
    hostname?: StringFilter<"TenantDomain"> | string
    status?: StringFilter<"TenantDomain"> | string
    isPrimary?: BoolFilter<"TenantDomain"> | boolean
    isVerified?: BoolFilter<"TenantDomain"> | boolean
    verifiedAt?: DateTimeNullableFilter<"TenantDomain"> | Date | string | null
    createdAt?: DateTimeFilter<"TenantDomain"> | Date | string
    updatedAt?: DateTimeFilter<"TenantDomain"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }, "id" | "hostnameNormalized">

  export type TenantDomainOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    hostname?: SortOrder
    hostnameNormalized?: SortOrder
    status?: SortOrder
    isPrimary?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TenantDomainCountOrderByAggregateInput
    _max?: TenantDomainMaxOrderByAggregateInput
    _min?: TenantDomainMinOrderByAggregateInput
  }

  export type TenantDomainScalarWhereWithAggregatesInput = {
    AND?: TenantDomainScalarWhereWithAggregatesInput | TenantDomainScalarWhereWithAggregatesInput[]
    OR?: TenantDomainScalarWhereWithAggregatesInput[]
    NOT?: TenantDomainScalarWhereWithAggregatesInput | TenantDomainScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TenantDomain"> | string
    tenantId?: StringWithAggregatesFilter<"TenantDomain"> | string
    hostname?: StringWithAggregatesFilter<"TenantDomain"> | string
    hostnameNormalized?: StringWithAggregatesFilter<"TenantDomain"> | string
    status?: StringWithAggregatesFilter<"TenantDomain"> | string
    isPrimary?: BoolWithAggregatesFilter<"TenantDomain"> | boolean
    isVerified?: BoolWithAggregatesFilter<"TenantDomain"> | boolean
    verifiedAt?: DateTimeNullableWithAggregatesFilter<"TenantDomain"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TenantDomain"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TenantDomain"> | Date | string
  }

  export type WebsiteConfigWhereInput = {
    AND?: WebsiteConfigWhereInput | WebsiteConfigWhereInput[]
    OR?: WebsiteConfigWhereInput[]
    NOT?: WebsiteConfigWhereInput | WebsiteConfigWhereInput[]
    id?: StringFilter<"WebsiteConfig"> | string
    tenantId?: StringFilter<"WebsiteConfig"> | string
    createdAt?: DateTimeFilter<"WebsiteConfig"> | Date | string
    updatedAt?: DateTimeFilter<"WebsiteConfig"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    modules?: ModuleConfigListRelationFilter
  }

  export type WebsiteConfigOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
    modules?: ModuleConfigOrderByRelationAggregateInput
  }

  export type WebsiteConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId?: string
    AND?: WebsiteConfigWhereInput | WebsiteConfigWhereInput[]
    OR?: WebsiteConfigWhereInput[]
    NOT?: WebsiteConfigWhereInput | WebsiteConfigWhereInput[]
    createdAt?: DateTimeFilter<"WebsiteConfig"> | Date | string
    updatedAt?: DateTimeFilter<"WebsiteConfig"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    modules?: ModuleConfigListRelationFilter
  }, "id" | "tenantId">

  export type WebsiteConfigOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WebsiteConfigCountOrderByAggregateInput
    _max?: WebsiteConfigMaxOrderByAggregateInput
    _min?: WebsiteConfigMinOrderByAggregateInput
  }

  export type WebsiteConfigScalarWhereWithAggregatesInput = {
    AND?: WebsiteConfigScalarWhereWithAggregatesInput | WebsiteConfigScalarWhereWithAggregatesInput[]
    OR?: WebsiteConfigScalarWhereWithAggregatesInput[]
    NOT?: WebsiteConfigScalarWhereWithAggregatesInput | WebsiteConfigScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WebsiteConfig"> | string
    tenantId?: StringWithAggregatesFilter<"WebsiteConfig"> | string
    createdAt?: DateTimeWithAggregatesFilter<"WebsiteConfig"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WebsiteConfig"> | Date | string
  }

  export type TenantControlSettingsWhereInput = {
    AND?: TenantControlSettingsWhereInput | TenantControlSettingsWhereInput[]
    OR?: TenantControlSettingsWhereInput[]
    NOT?: TenantControlSettingsWhereInput | TenantControlSettingsWhereInput[]
    id?: StringFilter<"TenantControlSettings"> | string
    tenantId?: StringFilter<"TenantControlSettings"> | string
    status?: StringFilter<"TenantControlSettings"> | string
    planCode?: StringFilter<"TenantControlSettings"> | string
    featureFlagsJson?: StringFilter<"TenantControlSettings"> | string
    createdAt?: DateTimeFilter<"TenantControlSettings"> | Date | string
    updatedAt?: DateTimeFilter<"TenantControlSettings"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }

  export type TenantControlSettingsOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    planCode?: SortOrder
    featureFlagsJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
  }

  export type TenantControlSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId?: string
    AND?: TenantControlSettingsWhereInput | TenantControlSettingsWhereInput[]
    OR?: TenantControlSettingsWhereInput[]
    NOT?: TenantControlSettingsWhereInput | TenantControlSettingsWhereInput[]
    status?: StringFilter<"TenantControlSettings"> | string
    planCode?: StringFilter<"TenantControlSettings"> | string
    featureFlagsJson?: StringFilter<"TenantControlSettings"> | string
    createdAt?: DateTimeFilter<"TenantControlSettings"> | Date | string
    updatedAt?: DateTimeFilter<"TenantControlSettings"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }, "id" | "tenantId">

  export type TenantControlSettingsOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    planCode?: SortOrder
    featureFlagsJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TenantControlSettingsCountOrderByAggregateInput
    _max?: TenantControlSettingsMaxOrderByAggregateInput
    _min?: TenantControlSettingsMinOrderByAggregateInput
  }

  export type TenantControlSettingsScalarWhereWithAggregatesInput = {
    AND?: TenantControlSettingsScalarWhereWithAggregatesInput | TenantControlSettingsScalarWhereWithAggregatesInput[]
    OR?: TenantControlSettingsScalarWhereWithAggregatesInput[]
    NOT?: TenantControlSettingsScalarWhereWithAggregatesInput | TenantControlSettingsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TenantControlSettings"> | string
    tenantId?: StringWithAggregatesFilter<"TenantControlSettings"> | string
    status?: StringWithAggregatesFilter<"TenantControlSettings"> | string
    planCode?: StringWithAggregatesFilter<"TenantControlSettings"> | string
    featureFlagsJson?: StringWithAggregatesFilter<"TenantControlSettings"> | string
    createdAt?: DateTimeWithAggregatesFilter<"TenantControlSettings"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TenantControlSettings"> | Date | string
  }

  export type TenantControlActorWhereInput = {
    AND?: TenantControlActorWhereInput | TenantControlActorWhereInput[]
    OR?: TenantControlActorWhereInput[]
    NOT?: TenantControlActorWhereInput | TenantControlActorWhereInput[]
    id?: StringFilter<"TenantControlActor"> | string
    tenantId?: StringFilter<"TenantControlActor"> | string
    actorId?: StringFilter<"TenantControlActor"> | string
    displayName?: StringNullableFilter<"TenantControlActor"> | string | null
    email?: StringNullableFilter<"TenantControlActor"> | string | null
    role?: StringFilter<"TenantControlActor"> | string
    permissionsJson?: StringFilter<"TenantControlActor"> | string
    supportSessionActive?: BoolFilter<"TenantControlActor"> | boolean
    supportSessionStartedAt?: DateTimeNullableFilter<"TenantControlActor"> | Date | string | null
    supportSessionExpiresAt?: DateTimeNullableFilter<"TenantControlActor"> | Date | string | null
    createdAt?: DateTimeFilter<"TenantControlActor"> | Date | string
    updatedAt?: DateTimeFilter<"TenantControlActor"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }

  export type TenantControlActorOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    actorId?: SortOrder
    displayName?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    role?: SortOrder
    permissionsJson?: SortOrder
    supportSessionActive?: SortOrder
    supportSessionStartedAt?: SortOrderInput | SortOrder
    supportSessionExpiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
  }

  export type TenantControlActorWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_actorId?: TenantControlActorTenantIdActorIdCompoundUniqueInput
    AND?: TenantControlActorWhereInput | TenantControlActorWhereInput[]
    OR?: TenantControlActorWhereInput[]
    NOT?: TenantControlActorWhereInput | TenantControlActorWhereInput[]
    tenantId?: StringFilter<"TenantControlActor"> | string
    actorId?: StringFilter<"TenantControlActor"> | string
    displayName?: StringNullableFilter<"TenantControlActor"> | string | null
    email?: StringNullableFilter<"TenantControlActor"> | string | null
    role?: StringFilter<"TenantControlActor"> | string
    permissionsJson?: StringFilter<"TenantControlActor"> | string
    supportSessionActive?: BoolFilter<"TenantControlActor"> | boolean
    supportSessionStartedAt?: DateTimeNullableFilter<"TenantControlActor"> | Date | string | null
    supportSessionExpiresAt?: DateTimeNullableFilter<"TenantControlActor"> | Date | string | null
    createdAt?: DateTimeFilter<"TenantControlActor"> | Date | string
    updatedAt?: DateTimeFilter<"TenantControlActor"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }, "id" | "tenantId_actorId">

  export type TenantControlActorOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    actorId?: SortOrder
    displayName?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    role?: SortOrder
    permissionsJson?: SortOrder
    supportSessionActive?: SortOrder
    supportSessionStartedAt?: SortOrderInput | SortOrder
    supportSessionExpiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TenantControlActorCountOrderByAggregateInput
    _max?: TenantControlActorMaxOrderByAggregateInput
    _min?: TenantControlActorMinOrderByAggregateInput
  }

  export type TenantControlActorScalarWhereWithAggregatesInput = {
    AND?: TenantControlActorScalarWhereWithAggregatesInput | TenantControlActorScalarWhereWithAggregatesInput[]
    OR?: TenantControlActorScalarWhereWithAggregatesInput[]
    NOT?: TenantControlActorScalarWhereWithAggregatesInput | TenantControlActorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TenantControlActor"> | string
    tenantId?: StringWithAggregatesFilter<"TenantControlActor"> | string
    actorId?: StringWithAggregatesFilter<"TenantControlActor"> | string
    displayName?: StringNullableWithAggregatesFilter<"TenantControlActor"> | string | null
    email?: StringNullableWithAggregatesFilter<"TenantControlActor"> | string | null
    role?: StringWithAggregatesFilter<"TenantControlActor"> | string
    permissionsJson?: StringWithAggregatesFilter<"TenantControlActor"> | string
    supportSessionActive?: BoolWithAggregatesFilter<"TenantControlActor"> | boolean
    supportSessionStartedAt?: DateTimeNullableWithAggregatesFilter<"TenantControlActor"> | Date | string | null
    supportSessionExpiresAt?: DateTimeNullableWithAggregatesFilter<"TenantControlActor"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TenantControlActor"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TenantControlActor"> | Date | string
  }

  export type ModuleConfigWhereInput = {
    AND?: ModuleConfigWhereInput | ModuleConfigWhereInput[]
    OR?: ModuleConfigWhereInput[]
    NOT?: ModuleConfigWhereInput | ModuleConfigWhereInput[]
    id?: StringFilter<"ModuleConfig"> | string
    websiteConfigId?: StringFilter<"ModuleConfig"> | string
    tenantId?: StringFilter<"ModuleConfig"> | string
    moduleKey?: StringFilter<"ModuleConfig"> | string
    enabled?: BoolFilter<"ModuleConfig"> | boolean
    sortOrder?: IntFilter<"ModuleConfig"> | number
    createdAt?: DateTimeFilter<"ModuleConfig"> | Date | string
    updatedAt?: DateTimeFilter<"ModuleConfig"> | Date | string
    websiteConfig?: XOR<WebsiteConfigScalarRelationFilter, WebsiteConfigWhereInput>
  }

  export type ModuleConfigOrderByWithRelationInput = {
    id?: SortOrder
    websiteConfigId?: SortOrder
    tenantId?: SortOrder
    moduleKey?: SortOrder
    enabled?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    websiteConfig?: WebsiteConfigOrderByWithRelationInput
  }

  export type ModuleConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    websiteConfigId_moduleKey?: ModuleConfigWebsiteConfigIdModuleKeyCompoundUniqueInput
    AND?: ModuleConfigWhereInput | ModuleConfigWhereInput[]
    OR?: ModuleConfigWhereInput[]
    NOT?: ModuleConfigWhereInput | ModuleConfigWhereInput[]
    websiteConfigId?: StringFilter<"ModuleConfig"> | string
    tenantId?: StringFilter<"ModuleConfig"> | string
    moduleKey?: StringFilter<"ModuleConfig"> | string
    enabled?: BoolFilter<"ModuleConfig"> | boolean
    sortOrder?: IntFilter<"ModuleConfig"> | number
    createdAt?: DateTimeFilter<"ModuleConfig"> | Date | string
    updatedAt?: DateTimeFilter<"ModuleConfig"> | Date | string
    websiteConfig?: XOR<WebsiteConfigScalarRelationFilter, WebsiteConfigWhereInput>
  }, "id" | "websiteConfigId_moduleKey">

  export type ModuleConfigOrderByWithAggregationInput = {
    id?: SortOrder
    websiteConfigId?: SortOrder
    tenantId?: SortOrder
    moduleKey?: SortOrder
    enabled?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ModuleConfigCountOrderByAggregateInput
    _avg?: ModuleConfigAvgOrderByAggregateInput
    _max?: ModuleConfigMaxOrderByAggregateInput
    _min?: ModuleConfigMinOrderByAggregateInput
    _sum?: ModuleConfigSumOrderByAggregateInput
  }

  export type ModuleConfigScalarWhereWithAggregatesInput = {
    AND?: ModuleConfigScalarWhereWithAggregatesInput | ModuleConfigScalarWhereWithAggregatesInput[]
    OR?: ModuleConfigScalarWhereWithAggregatesInput[]
    NOT?: ModuleConfigScalarWhereWithAggregatesInput | ModuleConfigScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModuleConfig"> | string
    websiteConfigId?: StringWithAggregatesFilter<"ModuleConfig"> | string
    tenantId?: StringWithAggregatesFilter<"ModuleConfig"> | string
    moduleKey?: StringWithAggregatesFilter<"ModuleConfig"> | string
    enabled?: BoolWithAggregatesFilter<"ModuleConfig"> | boolean
    sortOrder?: IntWithAggregatesFilter<"ModuleConfig"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ModuleConfig"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ModuleConfig"> | Date | string
  }

  export type ContactWhereInput = {
    AND?: ContactWhereInput | ContactWhereInput[]
    OR?: ContactWhereInput[]
    NOT?: ContactWhereInput | ContactWhereInput[]
    id?: StringFilter<"Contact"> | string
    tenantId?: StringFilter<"Contact"> | string
    fullName?: StringNullableFilter<"Contact"> | string | null
    email?: StringNullableFilter<"Contact"> | string | null
    emailNormalized?: StringNullableFilter<"Contact"> | string | null
    phone?: StringNullableFilter<"Contact"> | string | null
    phoneNormalized?: StringNullableFilter<"Contact"> | string | null
    source?: StringFilter<"Contact"> | string
    createdAt?: DateTimeFilter<"Contact"> | Date | string
    updatedAt?: DateTimeFilter<"Contact"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    leads?: LeadListRelationFilter
    activities?: ActivityListRelationFilter
  }

  export type ContactOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fullName?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    emailNormalized?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    phoneNormalized?: SortOrderInput | SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
    leads?: LeadOrderByRelationAggregateInput
    activities?: ActivityOrderByRelationAggregateInput
  }

  export type ContactWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_emailNormalized?: ContactTenantIdEmailNormalizedCompoundUniqueInput
    tenantId_phoneNormalized?: ContactTenantIdPhoneNormalizedCompoundUniqueInput
    AND?: ContactWhereInput | ContactWhereInput[]
    OR?: ContactWhereInput[]
    NOT?: ContactWhereInput | ContactWhereInput[]
    tenantId?: StringFilter<"Contact"> | string
    fullName?: StringNullableFilter<"Contact"> | string | null
    email?: StringNullableFilter<"Contact"> | string | null
    emailNormalized?: StringNullableFilter<"Contact"> | string | null
    phone?: StringNullableFilter<"Contact"> | string | null
    phoneNormalized?: StringNullableFilter<"Contact"> | string | null
    source?: StringFilter<"Contact"> | string
    createdAt?: DateTimeFilter<"Contact"> | Date | string
    updatedAt?: DateTimeFilter<"Contact"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    leads?: LeadListRelationFilter
    activities?: ActivityListRelationFilter
  }, "id" | "tenantId_emailNormalized" | "tenantId_phoneNormalized">

  export type ContactOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fullName?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    emailNormalized?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    phoneNormalized?: SortOrderInput | SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContactCountOrderByAggregateInput
    _max?: ContactMaxOrderByAggregateInput
    _min?: ContactMinOrderByAggregateInput
  }

  export type ContactScalarWhereWithAggregatesInput = {
    AND?: ContactScalarWhereWithAggregatesInput | ContactScalarWhereWithAggregatesInput[]
    OR?: ContactScalarWhereWithAggregatesInput[]
    NOT?: ContactScalarWhereWithAggregatesInput | ContactScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Contact"> | string
    tenantId?: StringWithAggregatesFilter<"Contact"> | string
    fullName?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    email?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    emailNormalized?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    phone?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    phoneNormalized?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    source?: StringWithAggregatesFilter<"Contact"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Contact"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Contact"> | Date | string
  }

  export type LeadWhereInput = {
    AND?: LeadWhereInput | LeadWhereInput[]
    OR?: LeadWhereInput[]
    NOT?: LeadWhereInput | LeadWhereInput[]
    id?: StringFilter<"Lead"> | string
    tenantId?: StringFilter<"Lead"> | string
    contactId?: StringNullableFilter<"Lead"> | string | null
    status?: StringFilter<"Lead"> | string
    leadType?: StringFilter<"Lead"> | string
    source?: StringFilter<"Lead"> | string
    timeframe?: StringNullableFilter<"Lead"> | string | null
    notes?: StringNullableFilter<"Lead"> | string | null
    listingId?: StringNullableFilter<"Lead"> | string | null
    listingUrl?: StringNullableFilter<"Lead"> | string | null
    listingAddress?: StringNullableFilter<"Lead"> | string | null
    propertyType?: StringNullableFilter<"Lead"> | string | null
    beds?: IntNullableFilter<"Lead"> | number | null
    baths?: IntNullableFilter<"Lead"> | number | null
    sqft?: IntNullableFilter<"Lead"> | number | null
    createdAt?: DateTimeFilter<"Lead"> | Date | string
    updatedAt?: DateTimeFilter<"Lead"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    contact?: XOR<ContactNullableScalarRelationFilter, ContactWhereInput> | null
    activities?: ActivityListRelationFilter
  }

  export type LeadOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrderInput | SortOrder
    status?: SortOrder
    leadType?: SortOrder
    source?: SortOrder
    timeframe?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    listingId?: SortOrderInput | SortOrder
    listingUrl?: SortOrderInput | SortOrder
    listingAddress?: SortOrderInput | SortOrder
    propertyType?: SortOrderInput | SortOrder
    beds?: SortOrderInput | SortOrder
    baths?: SortOrderInput | SortOrder
    sqft?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
    contact?: ContactOrderByWithRelationInput
    activities?: ActivityOrderByRelationAggregateInput
  }

  export type LeadWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LeadWhereInput | LeadWhereInput[]
    OR?: LeadWhereInput[]
    NOT?: LeadWhereInput | LeadWhereInput[]
    tenantId?: StringFilter<"Lead"> | string
    contactId?: StringNullableFilter<"Lead"> | string | null
    status?: StringFilter<"Lead"> | string
    leadType?: StringFilter<"Lead"> | string
    source?: StringFilter<"Lead"> | string
    timeframe?: StringNullableFilter<"Lead"> | string | null
    notes?: StringNullableFilter<"Lead"> | string | null
    listingId?: StringNullableFilter<"Lead"> | string | null
    listingUrl?: StringNullableFilter<"Lead"> | string | null
    listingAddress?: StringNullableFilter<"Lead"> | string | null
    propertyType?: StringNullableFilter<"Lead"> | string | null
    beds?: IntNullableFilter<"Lead"> | number | null
    baths?: IntNullableFilter<"Lead"> | number | null
    sqft?: IntNullableFilter<"Lead"> | number | null
    createdAt?: DateTimeFilter<"Lead"> | Date | string
    updatedAt?: DateTimeFilter<"Lead"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    contact?: XOR<ContactNullableScalarRelationFilter, ContactWhereInput> | null
    activities?: ActivityListRelationFilter
  }, "id">

  export type LeadOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrderInput | SortOrder
    status?: SortOrder
    leadType?: SortOrder
    source?: SortOrder
    timeframe?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    listingId?: SortOrderInput | SortOrder
    listingUrl?: SortOrderInput | SortOrder
    listingAddress?: SortOrderInput | SortOrder
    propertyType?: SortOrderInput | SortOrder
    beds?: SortOrderInput | SortOrder
    baths?: SortOrderInput | SortOrder
    sqft?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LeadCountOrderByAggregateInput
    _avg?: LeadAvgOrderByAggregateInput
    _max?: LeadMaxOrderByAggregateInput
    _min?: LeadMinOrderByAggregateInput
    _sum?: LeadSumOrderByAggregateInput
  }

  export type LeadScalarWhereWithAggregatesInput = {
    AND?: LeadScalarWhereWithAggregatesInput | LeadScalarWhereWithAggregatesInput[]
    OR?: LeadScalarWhereWithAggregatesInput[]
    NOT?: LeadScalarWhereWithAggregatesInput | LeadScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Lead"> | string
    tenantId?: StringWithAggregatesFilter<"Lead"> | string
    contactId?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    status?: StringWithAggregatesFilter<"Lead"> | string
    leadType?: StringWithAggregatesFilter<"Lead"> | string
    source?: StringWithAggregatesFilter<"Lead"> | string
    timeframe?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    notes?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    listingId?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    listingUrl?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    listingAddress?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    propertyType?: StringNullableWithAggregatesFilter<"Lead"> | string | null
    beds?: IntNullableWithAggregatesFilter<"Lead"> | number | null
    baths?: IntNullableWithAggregatesFilter<"Lead"> | number | null
    sqft?: IntNullableWithAggregatesFilter<"Lead"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Lead"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Lead"> | Date | string
  }

  export type ActivityWhereInput = {
    AND?: ActivityWhereInput | ActivityWhereInput[]
    OR?: ActivityWhereInput[]
    NOT?: ActivityWhereInput | ActivityWhereInput[]
    id?: StringFilter<"Activity"> | string
    tenantId?: StringFilter<"Activity"> | string
    contactId?: StringNullableFilter<"Activity"> | string | null
    leadId?: StringNullableFilter<"Activity"> | string | null
    activityType?: StringFilter<"Activity"> | string
    occurredAt?: DateTimeFilter<"Activity"> | Date | string
    summary?: StringFilter<"Activity"> | string
    metadataJson?: StringNullableFilter<"Activity"> | string | null
    createdAt?: DateTimeFilter<"Activity"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    contact?: XOR<ContactNullableScalarRelationFilter, ContactWhereInput> | null
    lead?: XOR<LeadNullableScalarRelationFilter, LeadWhereInput> | null
  }

  export type ActivityOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrderInput | SortOrder
    leadId?: SortOrderInput | SortOrder
    activityType?: SortOrder
    occurredAt?: SortOrder
    summary?: SortOrder
    metadataJson?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
    contact?: ContactOrderByWithRelationInput
    lead?: LeadOrderByWithRelationInput
  }

  export type ActivityWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ActivityWhereInput | ActivityWhereInput[]
    OR?: ActivityWhereInput[]
    NOT?: ActivityWhereInput | ActivityWhereInput[]
    tenantId?: StringFilter<"Activity"> | string
    contactId?: StringNullableFilter<"Activity"> | string | null
    leadId?: StringNullableFilter<"Activity"> | string | null
    activityType?: StringFilter<"Activity"> | string
    occurredAt?: DateTimeFilter<"Activity"> | Date | string
    summary?: StringFilter<"Activity"> | string
    metadataJson?: StringNullableFilter<"Activity"> | string | null
    createdAt?: DateTimeFilter<"Activity"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
    contact?: XOR<ContactNullableScalarRelationFilter, ContactWhereInput> | null
    lead?: XOR<LeadNullableScalarRelationFilter, LeadWhereInput> | null
  }, "id">

  export type ActivityOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrderInput | SortOrder
    leadId?: SortOrderInput | SortOrder
    activityType?: SortOrder
    occurredAt?: SortOrder
    summary?: SortOrder
    metadataJson?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ActivityCountOrderByAggregateInput
    _max?: ActivityMaxOrderByAggregateInput
    _min?: ActivityMinOrderByAggregateInput
  }

  export type ActivityScalarWhereWithAggregatesInput = {
    AND?: ActivityScalarWhereWithAggregatesInput | ActivityScalarWhereWithAggregatesInput[]
    OR?: ActivityScalarWhereWithAggregatesInput[]
    NOT?: ActivityScalarWhereWithAggregatesInput | ActivityScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Activity"> | string
    tenantId?: StringWithAggregatesFilter<"Activity"> | string
    contactId?: StringNullableWithAggregatesFilter<"Activity"> | string | null
    leadId?: StringNullableWithAggregatesFilter<"Activity"> | string | null
    activityType?: StringWithAggregatesFilter<"Activity"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"Activity"> | Date | string
    summary?: StringWithAggregatesFilter<"Activity"> | string
    metadataJson?: StringNullableWithAggregatesFilter<"Activity"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Activity"> | Date | string
  }

  export type IngestedEventWhereInput = {
    AND?: IngestedEventWhereInput | IngestedEventWhereInput[]
    OR?: IngestedEventWhereInput[]
    NOT?: IngestedEventWhereInput | IngestedEventWhereInput[]
    id?: StringFilter<"IngestedEvent"> | string
    tenantId?: StringFilter<"IngestedEvent"> | string
    eventType?: StringFilter<"IngestedEvent"> | string
    eventKey?: StringFilter<"IngestedEvent"> | string
    occurredAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    payloadJson?: StringFilter<"IngestedEvent"> | string
    processedAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    createdAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }

  export type IngestedEventOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    tenant?: TenantOrderByWithRelationInput
  }

  export type IngestedEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_eventKey?: IngestedEventTenantIdEventKeyCompoundUniqueInput
    AND?: IngestedEventWhereInput | IngestedEventWhereInput[]
    OR?: IngestedEventWhereInput[]
    NOT?: IngestedEventWhereInput | IngestedEventWhereInput[]
    tenantId?: StringFilter<"IngestedEvent"> | string
    eventType?: StringFilter<"IngestedEvent"> | string
    eventKey?: StringFilter<"IngestedEvent"> | string
    occurredAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    payloadJson?: StringFilter<"IngestedEvent"> | string
    processedAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    createdAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }, "id" | "tenantId_eventKey">

  export type IngestedEventOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    _count?: IngestedEventCountOrderByAggregateInput
    _max?: IngestedEventMaxOrderByAggregateInput
    _min?: IngestedEventMinOrderByAggregateInput
  }

  export type IngestedEventScalarWhereWithAggregatesInput = {
    AND?: IngestedEventScalarWhereWithAggregatesInput | IngestedEventScalarWhereWithAggregatesInput[]
    OR?: IngestedEventScalarWhereWithAggregatesInput[]
    NOT?: IngestedEventScalarWhereWithAggregatesInput | IngestedEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IngestedEvent"> | string
    tenantId?: StringWithAggregatesFilter<"IngestedEvent"> | string
    eventType?: StringWithAggregatesFilter<"IngestedEvent"> | string
    eventKey?: StringWithAggregatesFilter<"IngestedEvent"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"IngestedEvent"> | Date | string
    payloadJson?: StringWithAggregatesFilter<"IngestedEvent"> | string
    processedAt?: DateTimeWithAggregatesFilter<"IngestedEvent"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"IngestedEvent"> | Date | string
  }

  export type IngestionQueueJobWhereInput = {
    AND?: IngestionQueueJobWhereInput | IngestionQueueJobWhereInput[]
    OR?: IngestionQueueJobWhereInput[]
    NOT?: IngestionQueueJobWhereInput | IngestionQueueJobWhereInput[]
    id?: StringFilter<"IngestionQueueJob"> | string
    tenantId?: StringFilter<"IngestionQueueJob"> | string
    eventType?: StringFilter<"IngestionQueueJob"> | string
    eventKey?: StringFilter<"IngestionQueueJob"> | string
    occurredAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    payloadJson?: StringFilter<"IngestionQueueJob"> | string
    status?: StringFilter<"IngestionQueueJob"> | string
    attemptCount?: IntFilter<"IngestionQueueJob"> | number
    lastError?: StringNullableFilter<"IngestionQueueJob"> | string | null
    createdAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    updatedAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    processedAt?: DateTimeNullableFilter<"IngestionQueueJob"> | Date | string | null
    nextAttemptAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    deadLetteredAt?: DateTimeNullableFilter<"IngestionQueueJob"> | Date | string | null
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }

  export type IngestionQueueJobOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    nextAttemptAt?: SortOrder
    deadLetteredAt?: SortOrderInput | SortOrder
    tenant?: TenantOrderByWithRelationInput
  }

  export type IngestionQueueJobWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_eventKey?: IngestionQueueJobTenantIdEventKeyCompoundUniqueInput
    AND?: IngestionQueueJobWhereInput | IngestionQueueJobWhereInput[]
    OR?: IngestionQueueJobWhereInput[]
    NOT?: IngestionQueueJobWhereInput | IngestionQueueJobWhereInput[]
    tenantId?: StringFilter<"IngestionQueueJob"> | string
    eventType?: StringFilter<"IngestionQueueJob"> | string
    eventKey?: StringFilter<"IngestionQueueJob"> | string
    occurredAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    payloadJson?: StringFilter<"IngestionQueueJob"> | string
    status?: StringFilter<"IngestionQueueJob"> | string
    attemptCount?: IntFilter<"IngestionQueueJob"> | number
    lastError?: StringNullableFilter<"IngestionQueueJob"> | string | null
    createdAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    updatedAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    processedAt?: DateTimeNullableFilter<"IngestionQueueJob"> | Date | string | null
    nextAttemptAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    deadLetteredAt?: DateTimeNullableFilter<"IngestionQueueJob"> | Date | string | null
    tenant?: XOR<TenantScalarRelationFilter, TenantWhereInput>
  }, "id" | "tenantId_eventKey">

  export type IngestionQueueJobOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    nextAttemptAt?: SortOrder
    deadLetteredAt?: SortOrderInput | SortOrder
    _count?: IngestionQueueJobCountOrderByAggregateInput
    _avg?: IngestionQueueJobAvgOrderByAggregateInput
    _max?: IngestionQueueJobMaxOrderByAggregateInput
    _min?: IngestionQueueJobMinOrderByAggregateInput
    _sum?: IngestionQueueJobSumOrderByAggregateInput
  }

  export type IngestionQueueJobScalarWhereWithAggregatesInput = {
    AND?: IngestionQueueJobScalarWhereWithAggregatesInput | IngestionQueueJobScalarWhereWithAggregatesInput[]
    OR?: IngestionQueueJobScalarWhereWithAggregatesInput[]
    NOT?: IngestionQueueJobScalarWhereWithAggregatesInput | IngestionQueueJobScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IngestionQueueJob"> | string
    tenantId?: StringWithAggregatesFilter<"IngestionQueueJob"> | string
    eventType?: StringWithAggregatesFilter<"IngestionQueueJob"> | string
    eventKey?: StringWithAggregatesFilter<"IngestionQueueJob"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"IngestionQueueJob"> | Date | string
    payloadJson?: StringWithAggregatesFilter<"IngestionQueueJob"> | string
    status?: StringWithAggregatesFilter<"IngestionQueueJob"> | string
    attemptCount?: IntWithAggregatesFilter<"IngestionQueueJob"> | number
    lastError?: StringNullableWithAggregatesFilter<"IngestionQueueJob"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"IngestionQueueJob"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"IngestionQueueJob"> | Date | string
    processedAt?: DateTimeNullableWithAggregatesFilter<"IngestionQueueJob"> | Date | string | null
    nextAttemptAt?: DateTimeWithAggregatesFilter<"IngestionQueueJob"> | Date | string
    deadLetteredAt?: DateTimeNullableWithAggregatesFilter<"IngestionQueueJob"> | Date | string | null
  }

  export type AdminAuditEventWhereInput = {
    AND?: AdminAuditEventWhereInput | AdminAuditEventWhereInput[]
    OR?: AdminAuditEventWhereInput[]
    NOT?: AdminAuditEventWhereInput | AdminAuditEventWhereInput[]
    id?: StringFilter<"AdminAuditEvent"> | string
    tenantId?: StringNullableFilter<"AdminAuditEvent"> | string | null
    domainId?: StringNullableFilter<"AdminAuditEvent"> | string | null
    action?: StringFilter<"AdminAuditEvent"> | string
    status?: StringFilter<"AdminAuditEvent"> | string
    actorId?: StringNullableFilter<"AdminAuditEvent"> | string | null
    actorRole?: StringFilter<"AdminAuditEvent"> | string
    error?: StringNullableFilter<"AdminAuditEvent"> | string | null
    metadataJson?: StringNullableFilter<"AdminAuditEvent"> | string | null
    createdAt?: DateTimeFilter<"AdminAuditEvent"> | Date | string
  }

  export type AdminAuditEventOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    domainId?: SortOrderInput | SortOrder
    action?: SortOrder
    status?: SortOrder
    actorId?: SortOrderInput | SortOrder
    actorRole?: SortOrder
    error?: SortOrderInput | SortOrder
    metadataJson?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type AdminAuditEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AdminAuditEventWhereInput | AdminAuditEventWhereInput[]
    OR?: AdminAuditEventWhereInput[]
    NOT?: AdminAuditEventWhereInput | AdminAuditEventWhereInput[]
    tenantId?: StringNullableFilter<"AdminAuditEvent"> | string | null
    domainId?: StringNullableFilter<"AdminAuditEvent"> | string | null
    action?: StringFilter<"AdminAuditEvent"> | string
    status?: StringFilter<"AdminAuditEvent"> | string
    actorId?: StringNullableFilter<"AdminAuditEvent"> | string | null
    actorRole?: StringFilter<"AdminAuditEvent"> | string
    error?: StringNullableFilter<"AdminAuditEvent"> | string | null
    metadataJson?: StringNullableFilter<"AdminAuditEvent"> | string | null
    createdAt?: DateTimeFilter<"AdminAuditEvent"> | Date | string
  }, "id">

  export type AdminAuditEventOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    domainId?: SortOrderInput | SortOrder
    action?: SortOrder
    status?: SortOrder
    actorId?: SortOrderInput | SortOrder
    actorRole?: SortOrder
    error?: SortOrderInput | SortOrder
    metadataJson?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: AdminAuditEventCountOrderByAggregateInput
    _max?: AdminAuditEventMaxOrderByAggregateInput
    _min?: AdminAuditEventMinOrderByAggregateInput
  }

  export type AdminAuditEventScalarWhereWithAggregatesInput = {
    AND?: AdminAuditEventScalarWhereWithAggregatesInput | AdminAuditEventScalarWhereWithAggregatesInput[]
    OR?: AdminAuditEventScalarWhereWithAggregatesInput[]
    NOT?: AdminAuditEventScalarWhereWithAggregatesInput | AdminAuditEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AdminAuditEvent"> | string
    tenantId?: StringNullableWithAggregatesFilter<"AdminAuditEvent"> | string | null
    domainId?: StringNullableWithAggregatesFilter<"AdminAuditEvent"> | string | null
    action?: StringWithAggregatesFilter<"AdminAuditEvent"> | string
    status?: StringWithAggregatesFilter<"AdminAuditEvent"> | string
    actorId?: StringNullableWithAggregatesFilter<"AdminAuditEvent"> | string | null
    actorRole?: StringWithAggregatesFilter<"AdminAuditEvent"> | string
    error?: StringNullableWithAggregatesFilter<"AdminAuditEvent"> | string | null
    metadataJson?: StringNullableWithAggregatesFilter<"AdminAuditEvent"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"AdminAuditEvent"> | Date | string
  }

  export type TenantCreateInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type TenantCreateManyInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantDomainCreateInput = {
    id: string
    hostname: string
    hostnameNormalized: string
    status?: string
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutDomainsInput
  }

  export type TenantDomainUncheckedCreateInput = {
    id: string
    tenantId: string
    hostname: string
    hostnameNormalized: string
    status?: string
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantDomainUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutDomainsNestedInput
  }

  export type TenantDomainUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantDomainCreateManyInput = {
    id: string
    tenantId: string
    hostname: string
    hostnameNormalized: string
    status?: string
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantDomainUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantDomainUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebsiteConfigCreateInput = {
    id: string
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutWebsiteConfigInput
    modules?: ModuleConfigCreateNestedManyWithoutWebsiteConfigInput
  }

  export type WebsiteConfigUncheckedCreateInput = {
    id: string
    tenantId: string
    createdAt: Date | string
    updatedAt: Date | string
    modules?: ModuleConfigUncheckedCreateNestedManyWithoutWebsiteConfigInput
  }

  export type WebsiteConfigUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutWebsiteConfigNestedInput
    modules?: ModuleConfigUpdateManyWithoutWebsiteConfigNestedInput
  }

  export type WebsiteConfigUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modules?: ModuleConfigUncheckedUpdateManyWithoutWebsiteConfigNestedInput
  }

  export type WebsiteConfigCreateManyInput = {
    id: string
    tenantId: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type WebsiteConfigUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebsiteConfigUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlSettingsCreateInput = {
    id: string
    status?: string
    planCode?: string
    featureFlagsJson?: string
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutControlSettingsInput
  }

  export type TenantControlSettingsUncheckedCreateInput = {
    id: string
    tenantId: string
    status?: string
    planCode?: string
    featureFlagsJson?: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlSettingsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    planCode?: StringFieldUpdateOperationsInput | string
    featureFlagsJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutControlSettingsNestedInput
  }

  export type TenantControlSettingsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    planCode?: StringFieldUpdateOperationsInput | string
    featureFlagsJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlSettingsCreateManyInput = {
    id: string
    tenantId: string
    status?: string
    planCode?: string
    featureFlagsJson?: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlSettingsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    planCode?: StringFieldUpdateOperationsInput | string
    featureFlagsJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlSettingsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    planCode?: StringFieldUpdateOperationsInput | string
    featureFlagsJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorCreateInput = {
    id: string
    actorId: string
    displayName?: string | null
    email?: string | null
    role: string
    permissionsJson?: string
    supportSessionActive?: boolean
    supportSessionStartedAt?: Date | string | null
    supportSessionExpiresAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutControlActorsInput
  }

  export type TenantControlActorUncheckedCreateInput = {
    id: string
    tenantId: string
    actorId: string
    displayName?: string | null
    email?: string | null
    role: string
    permissionsJson?: string
    supportSessionActive?: boolean
    supportSessionStartedAt?: Date | string | null
    supportSessionExpiresAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlActorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutControlActorsNestedInput
  }

  export type TenantControlActorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorCreateManyInput = {
    id: string
    tenantId: string
    actorId: string
    displayName?: string | null
    email?: string | null
    role: string
    permissionsJson?: string
    supportSessionActive?: boolean
    supportSessionStartedAt?: Date | string | null
    supportSessionExpiresAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlActorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModuleConfigCreateInput = {
    id: string
    tenantId: string
    moduleKey: string
    enabled?: boolean
    sortOrder?: number
    createdAt: Date | string
    updatedAt: Date | string
    websiteConfig: WebsiteConfigCreateNestedOneWithoutModulesInput
  }

  export type ModuleConfigUncheckedCreateInput = {
    id: string
    websiteConfigId: string
    tenantId: string
    moduleKey: string
    enabled?: boolean
    sortOrder?: number
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ModuleConfigUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    websiteConfig?: WebsiteConfigUpdateOneRequiredWithoutModulesNestedInput
  }

  export type ModuleConfigUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    websiteConfigId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModuleConfigCreateManyInput = {
    id: string
    websiteConfigId: string
    tenantId: string
    moduleKey: string
    enabled?: boolean
    sortOrder?: number
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ModuleConfigUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModuleConfigUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    websiteConfigId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactCreateInput = {
    id: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutContactsInput
    leads?: LeadCreateNestedManyWithoutContactInput
    activities?: ActivityCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateInput = {
    id: string
    tenantId: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    leads?: LeadUncheckedCreateNestedManyWithoutContactInput
    activities?: ActivityUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutContactsNestedInput
    leads?: LeadUpdateManyWithoutContactNestedInput
    activities?: ActivityUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leads?: LeadUncheckedUpdateManyWithoutContactNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ContactCreateManyInput = {
    id: string
    tenantId: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ContactUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeadCreateInput = {
    id: string
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutLeadsInput
    contact?: ContactCreateNestedOneWithoutLeadsInput
    activities?: ActivityCreateNestedManyWithoutLeadInput
  }

  export type LeadUncheckedCreateInput = {
    id: string
    tenantId: string
    contactId?: string | null
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    activities?: ActivityUncheckedCreateNestedManyWithoutLeadInput
  }

  export type LeadUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutLeadsNestedInput
    contact?: ContactUpdateOneWithoutLeadsNestedInput
    activities?: ActivityUpdateManyWithoutLeadNestedInput
  }

  export type LeadUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: ActivityUncheckedUpdateManyWithoutLeadNestedInput
  }

  export type LeadCreateManyInput = {
    id: string
    tenantId: string
    contactId?: string | null
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type LeadUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeadUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityCreateInput = {
    id: string
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
    tenant: TenantCreateNestedOneWithoutActivitiesInput
    contact?: ContactCreateNestedOneWithoutActivitiesInput
    lead?: LeadCreateNestedOneWithoutActivitiesInput
  }

  export type ActivityUncheckedCreateInput = {
    id: string
    tenantId: string
    contactId?: string | null
    leadId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type ActivityUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutActivitiesNestedInput
    contact?: ContactUpdateOneWithoutActivitiesNestedInput
    lead?: LeadUpdateOneWithoutActivitiesNestedInput
  }

  export type ActivityUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    leadId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityCreateManyInput = {
    id: string
    tenantId: string
    contactId?: string | null
    leadId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type ActivityUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    leadId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestedEventCreateInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    processedAt: Date | string
    createdAt: Date | string
    tenant: TenantCreateNestedOneWithoutIngestedEventsInput
  }

  export type IngestedEventUncheckedCreateInput = {
    id: string
    tenantId: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    processedAt: Date | string
    createdAt: Date | string
  }

  export type IngestedEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutIngestedEventsNestedInput
  }

  export type IngestedEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestedEventCreateManyInput = {
    id: string
    tenantId: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    processedAt: Date | string
    createdAt: Date | string
  }

  export type IngestedEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestedEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestionQueueJobCreateInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    status: string
    attemptCount?: number
    lastError?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    processedAt?: Date | string | null
    nextAttemptAt?: Date | string
    deadLetteredAt?: Date | string | null
    tenant: TenantCreateNestedOneWithoutIngestionQueueJobsInput
  }

  export type IngestionQueueJobUncheckedCreateInput = {
    id: string
    tenantId: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    status: string
    attemptCount?: number
    lastError?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    processedAt?: Date | string | null
    nextAttemptAt?: Date | string
    deadLetteredAt?: Date | string | null
  }

  export type IngestionQueueJobUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant?: TenantUpdateOneRequiredWithoutIngestionQueueJobsNestedInput
  }

  export type IngestionQueueJobUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IngestionQueueJobCreateManyInput = {
    id: string
    tenantId: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    status: string
    attemptCount?: number
    lastError?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    processedAt?: Date | string | null
    nextAttemptAt?: Date | string
    deadLetteredAt?: Date | string | null
  }

  export type IngestionQueueJobUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IngestionQueueJobUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AdminAuditEventCreateInput = {
    id: string
    tenantId?: string | null
    domainId?: string | null
    action: string
    status: string
    actorId?: string | null
    actorRole: string
    error?: string | null
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type AdminAuditEventUncheckedCreateInput = {
    id: string
    tenantId?: string | null
    domainId?: string | null
    action: string
    status: string
    actorId?: string | null
    actorRole: string
    error?: string | null
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type AdminAuditEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    domainId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminAuditEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    domainId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminAuditEventCreateManyInput = {
    id: string
    tenantId?: string | null
    domainId?: string | null
    action: string
    status: string
    actorId?: string | null
    actorRole: string
    error?: string | null
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type AdminAuditEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    domainId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminAuditEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    domainId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type TenantDomainListRelationFilter = {
    every?: TenantDomainWhereInput
    some?: TenantDomainWhereInput
    none?: TenantDomainWhereInput
  }

  export type WebsiteConfigNullableScalarRelationFilter = {
    is?: WebsiteConfigWhereInput | null
    isNot?: WebsiteConfigWhereInput | null
  }

  export type TenantControlSettingsNullableScalarRelationFilter = {
    is?: TenantControlSettingsWhereInput | null
    isNot?: TenantControlSettingsWhereInput | null
  }

  export type TenantControlActorListRelationFilter = {
    every?: TenantControlActorWhereInput
    some?: TenantControlActorWhereInput
    none?: TenantControlActorWhereInput
  }

  export type ContactListRelationFilter = {
    every?: ContactWhereInput
    some?: ContactWhereInput
    none?: ContactWhereInput
  }

  export type LeadListRelationFilter = {
    every?: LeadWhereInput
    some?: LeadWhereInput
    none?: LeadWhereInput
  }

  export type ActivityListRelationFilter = {
    every?: ActivityWhereInput
    some?: ActivityWhereInput
    none?: ActivityWhereInput
  }

  export type IngestedEventListRelationFilter = {
    every?: IngestedEventWhereInput
    some?: IngestedEventWhereInput
    none?: IngestedEventWhereInput
  }

  export type IngestionQueueJobListRelationFilter = {
    every?: IngestionQueueJobWhereInput
    some?: IngestionQueueJobWhereInput
    none?: IngestionQueueJobWhereInput
  }

  export type TenantDomainOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TenantControlActorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ContactOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LeadOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ActivityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IngestedEventOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IngestionQueueJobOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TenantCountOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantMaxOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantMinOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type TenantScalarRelationFilter = {
    is?: TenantWhereInput
    isNot?: TenantWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TenantDomainCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    hostname?: SortOrder
    hostnameNormalized?: SortOrder
    status?: SortOrder
    isPrimary?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantDomainMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    hostname?: SortOrder
    hostnameNormalized?: SortOrder
    status?: SortOrder
    isPrimary?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantDomainMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    hostname?: SortOrder
    hostnameNormalized?: SortOrder
    status?: SortOrder
    isPrimary?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ModuleConfigListRelationFilter = {
    every?: ModuleConfigWhereInput
    some?: ModuleConfigWhereInput
    none?: ModuleConfigWhereInput
  }

  export type ModuleConfigOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WebsiteConfigCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebsiteConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebsiteConfigMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantControlSettingsCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    planCode?: SortOrder
    featureFlagsJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantControlSettingsMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    planCode?: SortOrder
    featureFlagsJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantControlSettingsMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    planCode?: SortOrder
    featureFlagsJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type TenantControlActorTenantIdActorIdCompoundUniqueInput = {
    tenantId: string
    actorId: string
  }

  export type TenantControlActorCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    actorId?: SortOrder
    displayName?: SortOrder
    email?: SortOrder
    role?: SortOrder
    permissionsJson?: SortOrder
    supportSessionActive?: SortOrder
    supportSessionStartedAt?: SortOrder
    supportSessionExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantControlActorMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    actorId?: SortOrder
    displayName?: SortOrder
    email?: SortOrder
    role?: SortOrder
    permissionsJson?: SortOrder
    supportSessionActive?: SortOrder
    supportSessionStartedAt?: SortOrder
    supportSessionExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TenantControlActorMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    actorId?: SortOrder
    displayName?: SortOrder
    email?: SortOrder
    role?: SortOrder
    permissionsJson?: SortOrder
    supportSessionActive?: SortOrder
    supportSessionStartedAt?: SortOrder
    supportSessionExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type WebsiteConfigScalarRelationFilter = {
    is?: WebsiteConfigWhereInput
    isNot?: WebsiteConfigWhereInput
  }

  export type ModuleConfigWebsiteConfigIdModuleKeyCompoundUniqueInput = {
    websiteConfigId: string
    moduleKey: string
  }

  export type ModuleConfigCountOrderByAggregateInput = {
    id?: SortOrder
    websiteConfigId?: SortOrder
    tenantId?: SortOrder
    moduleKey?: SortOrder
    enabled?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModuleConfigAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type ModuleConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    websiteConfigId?: SortOrder
    tenantId?: SortOrder
    moduleKey?: SortOrder
    enabled?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModuleConfigMinOrderByAggregateInput = {
    id?: SortOrder
    websiteConfigId?: SortOrder
    tenantId?: SortOrder
    moduleKey?: SortOrder
    enabled?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModuleConfigSumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type ContactTenantIdEmailNormalizedCompoundUniqueInput = {
    tenantId: string
    emailNormalized: string
  }

  export type ContactTenantIdPhoneNormalizedCompoundUniqueInput = {
    tenantId: string
    phoneNormalized: string
  }

  export type ContactCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fullName?: SortOrder
    email?: SortOrder
    emailNormalized?: SortOrder
    phone?: SortOrder
    phoneNormalized?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fullName?: SortOrder
    email?: SortOrder
    emailNormalized?: SortOrder
    phone?: SortOrder
    phoneNormalized?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fullName?: SortOrder
    email?: SortOrder
    emailNormalized?: SortOrder
    phone?: SortOrder
    phoneNormalized?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type ContactNullableScalarRelationFilter = {
    is?: ContactWhereInput | null
    isNot?: ContactWhereInput | null
  }

  export type LeadCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrder
    status?: SortOrder
    leadType?: SortOrder
    source?: SortOrder
    timeframe?: SortOrder
    notes?: SortOrder
    listingId?: SortOrder
    listingUrl?: SortOrder
    listingAddress?: SortOrder
    propertyType?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    sqft?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LeadAvgOrderByAggregateInput = {
    beds?: SortOrder
    baths?: SortOrder
    sqft?: SortOrder
  }

  export type LeadMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrder
    status?: SortOrder
    leadType?: SortOrder
    source?: SortOrder
    timeframe?: SortOrder
    notes?: SortOrder
    listingId?: SortOrder
    listingUrl?: SortOrder
    listingAddress?: SortOrder
    propertyType?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    sqft?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LeadMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrder
    status?: SortOrder
    leadType?: SortOrder
    source?: SortOrder
    timeframe?: SortOrder
    notes?: SortOrder
    listingId?: SortOrder
    listingUrl?: SortOrder
    listingAddress?: SortOrder
    propertyType?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    sqft?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LeadSumOrderByAggregateInput = {
    beds?: SortOrder
    baths?: SortOrder
    sqft?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type LeadNullableScalarRelationFilter = {
    is?: LeadWhereInput | null
    isNot?: LeadWhereInput | null
  }

  export type ActivityCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrder
    leadId?: SortOrder
    activityType?: SortOrder
    occurredAt?: SortOrder
    summary?: SortOrder
    metadataJson?: SortOrder
    createdAt?: SortOrder
  }

  export type ActivityMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrder
    leadId?: SortOrder
    activityType?: SortOrder
    occurredAt?: SortOrder
    summary?: SortOrder
    metadataJson?: SortOrder
    createdAt?: SortOrder
  }

  export type ActivityMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    contactId?: SortOrder
    leadId?: SortOrder
    activityType?: SortOrder
    occurredAt?: SortOrder
    summary?: SortOrder
    metadataJson?: SortOrder
    createdAt?: SortOrder
  }

  export type IngestedEventTenantIdEventKeyCompoundUniqueInput = {
    tenantId: string
    eventKey: string
  }

  export type IngestedEventCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type IngestedEventMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type IngestedEventMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type IngestionQueueJobTenantIdEventKeyCompoundUniqueInput = {
    tenantId: string
    eventKey: string
  }

  export type IngestionQueueJobCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    processedAt?: SortOrder
    nextAttemptAt?: SortOrder
    deadLetteredAt?: SortOrder
  }

  export type IngestionQueueJobAvgOrderByAggregateInput = {
    attemptCount?: SortOrder
  }

  export type IngestionQueueJobMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    processedAt?: SortOrder
    nextAttemptAt?: SortOrder
    deadLetteredAt?: SortOrder
  }

  export type IngestionQueueJobMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    eventType?: SortOrder
    eventKey?: SortOrder
    occurredAt?: SortOrder
    payloadJson?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    processedAt?: SortOrder
    nextAttemptAt?: SortOrder
    deadLetteredAt?: SortOrder
  }

  export type IngestionQueueJobSumOrderByAggregateInput = {
    attemptCount?: SortOrder
  }

  export type AdminAuditEventCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    domainId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    actorId?: SortOrder
    actorRole?: SortOrder
    error?: SortOrder
    metadataJson?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminAuditEventMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    domainId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    actorId?: SortOrder
    actorRole?: SortOrder
    error?: SortOrder
    metadataJson?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminAuditEventMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    domainId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    actorId?: SortOrder
    actorRole?: SortOrder
    error?: SortOrder
    metadataJson?: SortOrder
    createdAt?: SortOrder
  }

  export type TenantDomainCreateNestedManyWithoutTenantInput = {
    create?: XOR<TenantDomainCreateWithoutTenantInput, TenantDomainUncheckedCreateWithoutTenantInput> | TenantDomainCreateWithoutTenantInput[] | TenantDomainUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantDomainCreateOrConnectWithoutTenantInput | TenantDomainCreateOrConnectWithoutTenantInput[]
    createMany?: TenantDomainCreateManyTenantInputEnvelope
    connect?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
  }

  export type WebsiteConfigCreateNestedOneWithoutTenantInput = {
    create?: XOR<WebsiteConfigCreateWithoutTenantInput, WebsiteConfigUncheckedCreateWithoutTenantInput>
    connectOrCreate?: WebsiteConfigCreateOrConnectWithoutTenantInput
    connect?: WebsiteConfigWhereUniqueInput
  }

  export type TenantControlSettingsCreateNestedOneWithoutTenantInput = {
    create?: XOR<TenantControlSettingsCreateWithoutTenantInput, TenantControlSettingsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: TenantControlSettingsCreateOrConnectWithoutTenantInput
    connect?: TenantControlSettingsWhereUniqueInput
  }

  export type TenantControlActorCreateNestedManyWithoutTenantInput = {
    create?: XOR<TenantControlActorCreateWithoutTenantInput, TenantControlActorUncheckedCreateWithoutTenantInput> | TenantControlActorCreateWithoutTenantInput[] | TenantControlActorUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantControlActorCreateOrConnectWithoutTenantInput | TenantControlActorCreateOrConnectWithoutTenantInput[]
    createMany?: TenantControlActorCreateManyTenantInputEnvelope
    connect?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
  }

  export type ContactCreateNestedManyWithoutTenantInput = {
    create?: XOR<ContactCreateWithoutTenantInput, ContactUncheckedCreateWithoutTenantInput> | ContactCreateWithoutTenantInput[] | ContactUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutTenantInput | ContactCreateOrConnectWithoutTenantInput[]
    createMany?: ContactCreateManyTenantInputEnvelope
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
  }

  export type LeadCreateNestedManyWithoutTenantInput = {
    create?: XOR<LeadCreateWithoutTenantInput, LeadUncheckedCreateWithoutTenantInput> | LeadCreateWithoutTenantInput[] | LeadUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutTenantInput | LeadCreateOrConnectWithoutTenantInput[]
    createMany?: LeadCreateManyTenantInputEnvelope
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
  }

  export type ActivityCreateNestedManyWithoutTenantInput = {
    create?: XOR<ActivityCreateWithoutTenantInput, ActivityUncheckedCreateWithoutTenantInput> | ActivityCreateWithoutTenantInput[] | ActivityUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutTenantInput | ActivityCreateOrConnectWithoutTenantInput[]
    createMany?: ActivityCreateManyTenantInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type IngestedEventCreateNestedManyWithoutTenantInput = {
    create?: XOR<IngestedEventCreateWithoutTenantInput, IngestedEventUncheckedCreateWithoutTenantInput> | IngestedEventCreateWithoutTenantInput[] | IngestedEventUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestedEventCreateOrConnectWithoutTenantInput | IngestedEventCreateOrConnectWithoutTenantInput[]
    createMany?: IngestedEventCreateManyTenantInputEnvelope
    connect?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
  }

  export type IngestionQueueJobCreateNestedManyWithoutTenantInput = {
    create?: XOR<IngestionQueueJobCreateWithoutTenantInput, IngestionQueueJobUncheckedCreateWithoutTenantInput> | IngestionQueueJobCreateWithoutTenantInput[] | IngestionQueueJobUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestionQueueJobCreateOrConnectWithoutTenantInput | IngestionQueueJobCreateOrConnectWithoutTenantInput[]
    createMany?: IngestionQueueJobCreateManyTenantInputEnvelope
    connect?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
  }

  export type TenantDomainUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<TenantDomainCreateWithoutTenantInput, TenantDomainUncheckedCreateWithoutTenantInput> | TenantDomainCreateWithoutTenantInput[] | TenantDomainUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantDomainCreateOrConnectWithoutTenantInput | TenantDomainCreateOrConnectWithoutTenantInput[]
    createMany?: TenantDomainCreateManyTenantInputEnvelope
    connect?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
  }

  export type WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput = {
    create?: XOR<WebsiteConfigCreateWithoutTenantInput, WebsiteConfigUncheckedCreateWithoutTenantInput>
    connectOrCreate?: WebsiteConfigCreateOrConnectWithoutTenantInput
    connect?: WebsiteConfigWhereUniqueInput
  }

  export type TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput = {
    create?: XOR<TenantControlSettingsCreateWithoutTenantInput, TenantControlSettingsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: TenantControlSettingsCreateOrConnectWithoutTenantInput
    connect?: TenantControlSettingsWhereUniqueInput
  }

  export type TenantControlActorUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<TenantControlActorCreateWithoutTenantInput, TenantControlActorUncheckedCreateWithoutTenantInput> | TenantControlActorCreateWithoutTenantInput[] | TenantControlActorUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantControlActorCreateOrConnectWithoutTenantInput | TenantControlActorCreateOrConnectWithoutTenantInput[]
    createMany?: TenantControlActorCreateManyTenantInputEnvelope
    connect?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
  }

  export type ContactUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<ContactCreateWithoutTenantInput, ContactUncheckedCreateWithoutTenantInput> | ContactCreateWithoutTenantInput[] | ContactUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutTenantInput | ContactCreateOrConnectWithoutTenantInput[]
    createMany?: ContactCreateManyTenantInputEnvelope
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
  }

  export type LeadUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<LeadCreateWithoutTenantInput, LeadUncheckedCreateWithoutTenantInput> | LeadCreateWithoutTenantInput[] | LeadUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutTenantInput | LeadCreateOrConnectWithoutTenantInput[]
    createMany?: LeadCreateManyTenantInputEnvelope
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
  }

  export type ActivityUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<ActivityCreateWithoutTenantInput, ActivityUncheckedCreateWithoutTenantInput> | ActivityCreateWithoutTenantInput[] | ActivityUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutTenantInput | ActivityCreateOrConnectWithoutTenantInput[]
    createMany?: ActivityCreateManyTenantInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type IngestedEventUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<IngestedEventCreateWithoutTenantInput, IngestedEventUncheckedCreateWithoutTenantInput> | IngestedEventCreateWithoutTenantInput[] | IngestedEventUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestedEventCreateOrConnectWithoutTenantInput | IngestedEventCreateOrConnectWithoutTenantInput[]
    createMany?: IngestedEventCreateManyTenantInputEnvelope
    connect?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
  }

  export type IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<IngestionQueueJobCreateWithoutTenantInput, IngestionQueueJobUncheckedCreateWithoutTenantInput> | IngestionQueueJobCreateWithoutTenantInput[] | IngestionQueueJobUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestionQueueJobCreateOrConnectWithoutTenantInput | IngestionQueueJobCreateOrConnectWithoutTenantInput[]
    createMany?: IngestionQueueJobCreateManyTenantInputEnvelope
    connect?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type TenantDomainUpdateManyWithoutTenantNestedInput = {
    create?: XOR<TenantDomainCreateWithoutTenantInput, TenantDomainUncheckedCreateWithoutTenantInput> | TenantDomainCreateWithoutTenantInput[] | TenantDomainUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantDomainCreateOrConnectWithoutTenantInput | TenantDomainCreateOrConnectWithoutTenantInput[]
    upsert?: TenantDomainUpsertWithWhereUniqueWithoutTenantInput | TenantDomainUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: TenantDomainCreateManyTenantInputEnvelope
    set?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    disconnect?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    delete?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    connect?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    update?: TenantDomainUpdateWithWhereUniqueWithoutTenantInput | TenantDomainUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: TenantDomainUpdateManyWithWhereWithoutTenantInput | TenantDomainUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: TenantDomainScalarWhereInput | TenantDomainScalarWhereInput[]
  }

  export type WebsiteConfigUpdateOneWithoutTenantNestedInput = {
    create?: XOR<WebsiteConfigCreateWithoutTenantInput, WebsiteConfigUncheckedCreateWithoutTenantInput>
    connectOrCreate?: WebsiteConfigCreateOrConnectWithoutTenantInput
    upsert?: WebsiteConfigUpsertWithoutTenantInput
    disconnect?: WebsiteConfigWhereInput | boolean
    delete?: WebsiteConfigWhereInput | boolean
    connect?: WebsiteConfigWhereUniqueInput
    update?: XOR<XOR<WebsiteConfigUpdateToOneWithWhereWithoutTenantInput, WebsiteConfigUpdateWithoutTenantInput>, WebsiteConfigUncheckedUpdateWithoutTenantInput>
  }

  export type TenantControlSettingsUpdateOneWithoutTenantNestedInput = {
    create?: XOR<TenantControlSettingsCreateWithoutTenantInput, TenantControlSettingsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: TenantControlSettingsCreateOrConnectWithoutTenantInput
    upsert?: TenantControlSettingsUpsertWithoutTenantInput
    disconnect?: TenantControlSettingsWhereInput | boolean
    delete?: TenantControlSettingsWhereInput | boolean
    connect?: TenantControlSettingsWhereUniqueInput
    update?: XOR<XOR<TenantControlSettingsUpdateToOneWithWhereWithoutTenantInput, TenantControlSettingsUpdateWithoutTenantInput>, TenantControlSettingsUncheckedUpdateWithoutTenantInput>
  }

  export type TenantControlActorUpdateManyWithoutTenantNestedInput = {
    create?: XOR<TenantControlActorCreateWithoutTenantInput, TenantControlActorUncheckedCreateWithoutTenantInput> | TenantControlActorCreateWithoutTenantInput[] | TenantControlActorUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantControlActorCreateOrConnectWithoutTenantInput | TenantControlActorCreateOrConnectWithoutTenantInput[]
    upsert?: TenantControlActorUpsertWithWhereUniqueWithoutTenantInput | TenantControlActorUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: TenantControlActorCreateManyTenantInputEnvelope
    set?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    disconnect?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    delete?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    connect?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    update?: TenantControlActorUpdateWithWhereUniqueWithoutTenantInput | TenantControlActorUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: TenantControlActorUpdateManyWithWhereWithoutTenantInput | TenantControlActorUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: TenantControlActorScalarWhereInput | TenantControlActorScalarWhereInput[]
  }

  export type ContactUpdateManyWithoutTenantNestedInput = {
    create?: XOR<ContactCreateWithoutTenantInput, ContactUncheckedCreateWithoutTenantInput> | ContactCreateWithoutTenantInput[] | ContactUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutTenantInput | ContactCreateOrConnectWithoutTenantInput[]
    upsert?: ContactUpsertWithWhereUniqueWithoutTenantInput | ContactUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: ContactCreateManyTenantInputEnvelope
    set?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    disconnect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    delete?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    update?: ContactUpdateWithWhereUniqueWithoutTenantInput | ContactUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: ContactUpdateManyWithWhereWithoutTenantInput | ContactUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: ContactScalarWhereInput | ContactScalarWhereInput[]
  }

  export type LeadUpdateManyWithoutTenantNestedInput = {
    create?: XOR<LeadCreateWithoutTenantInput, LeadUncheckedCreateWithoutTenantInput> | LeadCreateWithoutTenantInput[] | LeadUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutTenantInput | LeadCreateOrConnectWithoutTenantInput[]
    upsert?: LeadUpsertWithWhereUniqueWithoutTenantInput | LeadUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: LeadCreateManyTenantInputEnvelope
    set?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    disconnect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    delete?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    update?: LeadUpdateWithWhereUniqueWithoutTenantInput | LeadUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: LeadUpdateManyWithWhereWithoutTenantInput | LeadUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: LeadScalarWhereInput | LeadScalarWhereInput[]
  }

  export type ActivityUpdateManyWithoutTenantNestedInput = {
    create?: XOR<ActivityCreateWithoutTenantInput, ActivityUncheckedCreateWithoutTenantInput> | ActivityCreateWithoutTenantInput[] | ActivityUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutTenantInput | ActivityCreateOrConnectWithoutTenantInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutTenantInput | ActivityUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: ActivityCreateManyTenantInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutTenantInput | ActivityUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutTenantInput | ActivityUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type IngestedEventUpdateManyWithoutTenantNestedInput = {
    create?: XOR<IngestedEventCreateWithoutTenantInput, IngestedEventUncheckedCreateWithoutTenantInput> | IngestedEventCreateWithoutTenantInput[] | IngestedEventUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestedEventCreateOrConnectWithoutTenantInput | IngestedEventCreateOrConnectWithoutTenantInput[]
    upsert?: IngestedEventUpsertWithWhereUniqueWithoutTenantInput | IngestedEventUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: IngestedEventCreateManyTenantInputEnvelope
    set?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    disconnect?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    delete?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    connect?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    update?: IngestedEventUpdateWithWhereUniqueWithoutTenantInput | IngestedEventUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: IngestedEventUpdateManyWithWhereWithoutTenantInput | IngestedEventUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: IngestedEventScalarWhereInput | IngestedEventScalarWhereInput[]
  }

  export type IngestionQueueJobUpdateManyWithoutTenantNestedInput = {
    create?: XOR<IngestionQueueJobCreateWithoutTenantInput, IngestionQueueJobUncheckedCreateWithoutTenantInput> | IngestionQueueJobCreateWithoutTenantInput[] | IngestionQueueJobUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestionQueueJobCreateOrConnectWithoutTenantInput | IngestionQueueJobCreateOrConnectWithoutTenantInput[]
    upsert?: IngestionQueueJobUpsertWithWhereUniqueWithoutTenantInput | IngestionQueueJobUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: IngestionQueueJobCreateManyTenantInputEnvelope
    set?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    disconnect?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    delete?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    connect?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    update?: IngestionQueueJobUpdateWithWhereUniqueWithoutTenantInput | IngestionQueueJobUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: IngestionQueueJobUpdateManyWithWhereWithoutTenantInput | IngestionQueueJobUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: IngestionQueueJobScalarWhereInput | IngestionQueueJobScalarWhereInput[]
  }

  export type TenantDomainUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<TenantDomainCreateWithoutTenantInput, TenantDomainUncheckedCreateWithoutTenantInput> | TenantDomainCreateWithoutTenantInput[] | TenantDomainUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantDomainCreateOrConnectWithoutTenantInput | TenantDomainCreateOrConnectWithoutTenantInput[]
    upsert?: TenantDomainUpsertWithWhereUniqueWithoutTenantInput | TenantDomainUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: TenantDomainCreateManyTenantInputEnvelope
    set?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    disconnect?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    delete?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    connect?: TenantDomainWhereUniqueInput | TenantDomainWhereUniqueInput[]
    update?: TenantDomainUpdateWithWhereUniqueWithoutTenantInput | TenantDomainUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: TenantDomainUpdateManyWithWhereWithoutTenantInput | TenantDomainUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: TenantDomainScalarWhereInput | TenantDomainScalarWhereInput[]
  }

  export type WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput = {
    create?: XOR<WebsiteConfigCreateWithoutTenantInput, WebsiteConfigUncheckedCreateWithoutTenantInput>
    connectOrCreate?: WebsiteConfigCreateOrConnectWithoutTenantInput
    upsert?: WebsiteConfigUpsertWithoutTenantInput
    disconnect?: WebsiteConfigWhereInput | boolean
    delete?: WebsiteConfigWhereInput | boolean
    connect?: WebsiteConfigWhereUniqueInput
    update?: XOR<XOR<WebsiteConfigUpdateToOneWithWhereWithoutTenantInput, WebsiteConfigUpdateWithoutTenantInput>, WebsiteConfigUncheckedUpdateWithoutTenantInput>
  }

  export type TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput = {
    create?: XOR<TenantControlSettingsCreateWithoutTenantInput, TenantControlSettingsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: TenantControlSettingsCreateOrConnectWithoutTenantInput
    upsert?: TenantControlSettingsUpsertWithoutTenantInput
    disconnect?: TenantControlSettingsWhereInput | boolean
    delete?: TenantControlSettingsWhereInput | boolean
    connect?: TenantControlSettingsWhereUniqueInput
    update?: XOR<XOR<TenantControlSettingsUpdateToOneWithWhereWithoutTenantInput, TenantControlSettingsUpdateWithoutTenantInput>, TenantControlSettingsUncheckedUpdateWithoutTenantInput>
  }

  export type TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<TenantControlActorCreateWithoutTenantInput, TenantControlActorUncheckedCreateWithoutTenantInput> | TenantControlActorCreateWithoutTenantInput[] | TenantControlActorUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: TenantControlActorCreateOrConnectWithoutTenantInput | TenantControlActorCreateOrConnectWithoutTenantInput[]
    upsert?: TenantControlActorUpsertWithWhereUniqueWithoutTenantInput | TenantControlActorUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: TenantControlActorCreateManyTenantInputEnvelope
    set?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    disconnect?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    delete?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    connect?: TenantControlActorWhereUniqueInput | TenantControlActorWhereUniqueInput[]
    update?: TenantControlActorUpdateWithWhereUniqueWithoutTenantInput | TenantControlActorUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: TenantControlActorUpdateManyWithWhereWithoutTenantInput | TenantControlActorUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: TenantControlActorScalarWhereInput | TenantControlActorScalarWhereInput[]
  }

  export type ContactUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<ContactCreateWithoutTenantInput, ContactUncheckedCreateWithoutTenantInput> | ContactCreateWithoutTenantInput[] | ContactUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutTenantInput | ContactCreateOrConnectWithoutTenantInput[]
    upsert?: ContactUpsertWithWhereUniqueWithoutTenantInput | ContactUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: ContactCreateManyTenantInputEnvelope
    set?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    disconnect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    delete?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    update?: ContactUpdateWithWhereUniqueWithoutTenantInput | ContactUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: ContactUpdateManyWithWhereWithoutTenantInput | ContactUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: ContactScalarWhereInput | ContactScalarWhereInput[]
  }

  export type LeadUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<LeadCreateWithoutTenantInput, LeadUncheckedCreateWithoutTenantInput> | LeadCreateWithoutTenantInput[] | LeadUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutTenantInput | LeadCreateOrConnectWithoutTenantInput[]
    upsert?: LeadUpsertWithWhereUniqueWithoutTenantInput | LeadUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: LeadCreateManyTenantInputEnvelope
    set?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    disconnect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    delete?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    update?: LeadUpdateWithWhereUniqueWithoutTenantInput | LeadUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: LeadUpdateManyWithWhereWithoutTenantInput | LeadUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: LeadScalarWhereInput | LeadScalarWhereInput[]
  }

  export type ActivityUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<ActivityCreateWithoutTenantInput, ActivityUncheckedCreateWithoutTenantInput> | ActivityCreateWithoutTenantInput[] | ActivityUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutTenantInput | ActivityCreateOrConnectWithoutTenantInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutTenantInput | ActivityUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: ActivityCreateManyTenantInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutTenantInput | ActivityUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutTenantInput | ActivityUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type IngestedEventUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<IngestedEventCreateWithoutTenantInput, IngestedEventUncheckedCreateWithoutTenantInput> | IngestedEventCreateWithoutTenantInput[] | IngestedEventUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestedEventCreateOrConnectWithoutTenantInput | IngestedEventCreateOrConnectWithoutTenantInput[]
    upsert?: IngestedEventUpsertWithWhereUniqueWithoutTenantInput | IngestedEventUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: IngestedEventCreateManyTenantInputEnvelope
    set?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    disconnect?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    delete?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    connect?: IngestedEventWhereUniqueInput | IngestedEventWhereUniqueInput[]
    update?: IngestedEventUpdateWithWhereUniqueWithoutTenantInput | IngestedEventUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: IngestedEventUpdateManyWithWhereWithoutTenantInput | IngestedEventUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: IngestedEventScalarWhereInput | IngestedEventScalarWhereInput[]
  }

  export type IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<IngestionQueueJobCreateWithoutTenantInput, IngestionQueueJobUncheckedCreateWithoutTenantInput> | IngestionQueueJobCreateWithoutTenantInput[] | IngestionQueueJobUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: IngestionQueueJobCreateOrConnectWithoutTenantInput | IngestionQueueJobCreateOrConnectWithoutTenantInput[]
    upsert?: IngestionQueueJobUpsertWithWhereUniqueWithoutTenantInput | IngestionQueueJobUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: IngestionQueueJobCreateManyTenantInputEnvelope
    set?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    disconnect?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    delete?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    connect?: IngestionQueueJobWhereUniqueInput | IngestionQueueJobWhereUniqueInput[]
    update?: IngestionQueueJobUpdateWithWhereUniqueWithoutTenantInput | IngestionQueueJobUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: IngestionQueueJobUpdateManyWithWhereWithoutTenantInput | IngestionQueueJobUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: IngestionQueueJobScalarWhereInput | IngestionQueueJobScalarWhereInput[]
  }

  export type TenantCreateNestedOneWithoutDomainsInput = {
    create?: XOR<TenantCreateWithoutDomainsInput, TenantUncheckedCreateWithoutDomainsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutDomainsInput
    connect?: TenantWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type TenantUpdateOneRequiredWithoutDomainsNestedInput = {
    create?: XOR<TenantCreateWithoutDomainsInput, TenantUncheckedCreateWithoutDomainsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutDomainsInput
    upsert?: TenantUpsertWithoutDomainsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutDomainsInput, TenantUpdateWithoutDomainsInput>, TenantUncheckedUpdateWithoutDomainsInput>
  }

  export type TenantCreateNestedOneWithoutWebsiteConfigInput = {
    create?: XOR<TenantCreateWithoutWebsiteConfigInput, TenantUncheckedCreateWithoutWebsiteConfigInput>
    connectOrCreate?: TenantCreateOrConnectWithoutWebsiteConfigInput
    connect?: TenantWhereUniqueInput
  }

  export type ModuleConfigCreateNestedManyWithoutWebsiteConfigInput = {
    create?: XOR<ModuleConfigCreateWithoutWebsiteConfigInput, ModuleConfigUncheckedCreateWithoutWebsiteConfigInput> | ModuleConfigCreateWithoutWebsiteConfigInput[] | ModuleConfigUncheckedCreateWithoutWebsiteConfigInput[]
    connectOrCreate?: ModuleConfigCreateOrConnectWithoutWebsiteConfigInput | ModuleConfigCreateOrConnectWithoutWebsiteConfigInput[]
    createMany?: ModuleConfigCreateManyWebsiteConfigInputEnvelope
    connect?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
  }

  export type ModuleConfigUncheckedCreateNestedManyWithoutWebsiteConfigInput = {
    create?: XOR<ModuleConfigCreateWithoutWebsiteConfigInput, ModuleConfigUncheckedCreateWithoutWebsiteConfigInput> | ModuleConfigCreateWithoutWebsiteConfigInput[] | ModuleConfigUncheckedCreateWithoutWebsiteConfigInput[]
    connectOrCreate?: ModuleConfigCreateOrConnectWithoutWebsiteConfigInput | ModuleConfigCreateOrConnectWithoutWebsiteConfigInput[]
    createMany?: ModuleConfigCreateManyWebsiteConfigInputEnvelope
    connect?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
  }

  export type TenantUpdateOneRequiredWithoutWebsiteConfigNestedInput = {
    create?: XOR<TenantCreateWithoutWebsiteConfigInput, TenantUncheckedCreateWithoutWebsiteConfigInput>
    connectOrCreate?: TenantCreateOrConnectWithoutWebsiteConfigInput
    upsert?: TenantUpsertWithoutWebsiteConfigInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutWebsiteConfigInput, TenantUpdateWithoutWebsiteConfigInput>, TenantUncheckedUpdateWithoutWebsiteConfigInput>
  }

  export type ModuleConfigUpdateManyWithoutWebsiteConfigNestedInput = {
    create?: XOR<ModuleConfigCreateWithoutWebsiteConfigInput, ModuleConfigUncheckedCreateWithoutWebsiteConfigInput> | ModuleConfigCreateWithoutWebsiteConfigInput[] | ModuleConfigUncheckedCreateWithoutWebsiteConfigInput[]
    connectOrCreate?: ModuleConfigCreateOrConnectWithoutWebsiteConfigInput | ModuleConfigCreateOrConnectWithoutWebsiteConfigInput[]
    upsert?: ModuleConfigUpsertWithWhereUniqueWithoutWebsiteConfigInput | ModuleConfigUpsertWithWhereUniqueWithoutWebsiteConfigInput[]
    createMany?: ModuleConfigCreateManyWebsiteConfigInputEnvelope
    set?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    disconnect?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    delete?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    connect?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    update?: ModuleConfigUpdateWithWhereUniqueWithoutWebsiteConfigInput | ModuleConfigUpdateWithWhereUniqueWithoutWebsiteConfigInput[]
    updateMany?: ModuleConfigUpdateManyWithWhereWithoutWebsiteConfigInput | ModuleConfigUpdateManyWithWhereWithoutWebsiteConfigInput[]
    deleteMany?: ModuleConfigScalarWhereInput | ModuleConfigScalarWhereInput[]
  }

  export type ModuleConfigUncheckedUpdateManyWithoutWebsiteConfigNestedInput = {
    create?: XOR<ModuleConfigCreateWithoutWebsiteConfigInput, ModuleConfigUncheckedCreateWithoutWebsiteConfigInput> | ModuleConfigCreateWithoutWebsiteConfigInput[] | ModuleConfigUncheckedCreateWithoutWebsiteConfigInput[]
    connectOrCreate?: ModuleConfigCreateOrConnectWithoutWebsiteConfigInput | ModuleConfigCreateOrConnectWithoutWebsiteConfigInput[]
    upsert?: ModuleConfigUpsertWithWhereUniqueWithoutWebsiteConfigInput | ModuleConfigUpsertWithWhereUniqueWithoutWebsiteConfigInput[]
    createMany?: ModuleConfigCreateManyWebsiteConfigInputEnvelope
    set?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    disconnect?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    delete?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    connect?: ModuleConfigWhereUniqueInput | ModuleConfigWhereUniqueInput[]
    update?: ModuleConfigUpdateWithWhereUniqueWithoutWebsiteConfigInput | ModuleConfigUpdateWithWhereUniqueWithoutWebsiteConfigInput[]
    updateMany?: ModuleConfigUpdateManyWithWhereWithoutWebsiteConfigInput | ModuleConfigUpdateManyWithWhereWithoutWebsiteConfigInput[]
    deleteMany?: ModuleConfigScalarWhereInput | ModuleConfigScalarWhereInput[]
  }

  export type TenantCreateNestedOneWithoutControlSettingsInput = {
    create?: XOR<TenantCreateWithoutControlSettingsInput, TenantUncheckedCreateWithoutControlSettingsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutControlSettingsInput
    connect?: TenantWhereUniqueInput
  }

  export type TenantUpdateOneRequiredWithoutControlSettingsNestedInput = {
    create?: XOR<TenantCreateWithoutControlSettingsInput, TenantUncheckedCreateWithoutControlSettingsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutControlSettingsInput
    upsert?: TenantUpsertWithoutControlSettingsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutControlSettingsInput, TenantUpdateWithoutControlSettingsInput>, TenantUncheckedUpdateWithoutControlSettingsInput>
  }

  export type TenantCreateNestedOneWithoutControlActorsInput = {
    create?: XOR<TenantCreateWithoutControlActorsInput, TenantUncheckedCreateWithoutControlActorsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutControlActorsInput
    connect?: TenantWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type TenantUpdateOneRequiredWithoutControlActorsNestedInput = {
    create?: XOR<TenantCreateWithoutControlActorsInput, TenantUncheckedCreateWithoutControlActorsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutControlActorsInput
    upsert?: TenantUpsertWithoutControlActorsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutControlActorsInput, TenantUpdateWithoutControlActorsInput>, TenantUncheckedUpdateWithoutControlActorsInput>
  }

  export type WebsiteConfigCreateNestedOneWithoutModulesInput = {
    create?: XOR<WebsiteConfigCreateWithoutModulesInput, WebsiteConfigUncheckedCreateWithoutModulesInput>
    connectOrCreate?: WebsiteConfigCreateOrConnectWithoutModulesInput
    connect?: WebsiteConfigWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type WebsiteConfigUpdateOneRequiredWithoutModulesNestedInput = {
    create?: XOR<WebsiteConfigCreateWithoutModulesInput, WebsiteConfigUncheckedCreateWithoutModulesInput>
    connectOrCreate?: WebsiteConfigCreateOrConnectWithoutModulesInput
    upsert?: WebsiteConfigUpsertWithoutModulesInput
    connect?: WebsiteConfigWhereUniqueInput
    update?: XOR<XOR<WebsiteConfigUpdateToOneWithWhereWithoutModulesInput, WebsiteConfigUpdateWithoutModulesInput>, WebsiteConfigUncheckedUpdateWithoutModulesInput>
  }

  export type TenantCreateNestedOneWithoutContactsInput = {
    create?: XOR<TenantCreateWithoutContactsInput, TenantUncheckedCreateWithoutContactsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutContactsInput
    connect?: TenantWhereUniqueInput
  }

  export type LeadCreateNestedManyWithoutContactInput = {
    create?: XOR<LeadCreateWithoutContactInput, LeadUncheckedCreateWithoutContactInput> | LeadCreateWithoutContactInput[] | LeadUncheckedCreateWithoutContactInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutContactInput | LeadCreateOrConnectWithoutContactInput[]
    createMany?: LeadCreateManyContactInputEnvelope
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
  }

  export type ActivityCreateNestedManyWithoutContactInput = {
    create?: XOR<ActivityCreateWithoutContactInput, ActivityUncheckedCreateWithoutContactInput> | ActivityCreateWithoutContactInput[] | ActivityUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutContactInput | ActivityCreateOrConnectWithoutContactInput[]
    createMany?: ActivityCreateManyContactInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type LeadUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<LeadCreateWithoutContactInput, LeadUncheckedCreateWithoutContactInput> | LeadCreateWithoutContactInput[] | LeadUncheckedCreateWithoutContactInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutContactInput | LeadCreateOrConnectWithoutContactInput[]
    createMany?: LeadCreateManyContactInputEnvelope
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
  }

  export type ActivityUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<ActivityCreateWithoutContactInput, ActivityUncheckedCreateWithoutContactInput> | ActivityCreateWithoutContactInput[] | ActivityUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutContactInput | ActivityCreateOrConnectWithoutContactInput[]
    createMany?: ActivityCreateManyContactInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type TenantUpdateOneRequiredWithoutContactsNestedInput = {
    create?: XOR<TenantCreateWithoutContactsInput, TenantUncheckedCreateWithoutContactsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutContactsInput
    upsert?: TenantUpsertWithoutContactsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutContactsInput, TenantUpdateWithoutContactsInput>, TenantUncheckedUpdateWithoutContactsInput>
  }

  export type LeadUpdateManyWithoutContactNestedInput = {
    create?: XOR<LeadCreateWithoutContactInput, LeadUncheckedCreateWithoutContactInput> | LeadCreateWithoutContactInput[] | LeadUncheckedCreateWithoutContactInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutContactInput | LeadCreateOrConnectWithoutContactInput[]
    upsert?: LeadUpsertWithWhereUniqueWithoutContactInput | LeadUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: LeadCreateManyContactInputEnvelope
    set?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    disconnect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    delete?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    update?: LeadUpdateWithWhereUniqueWithoutContactInput | LeadUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: LeadUpdateManyWithWhereWithoutContactInput | LeadUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: LeadScalarWhereInput | LeadScalarWhereInput[]
  }

  export type ActivityUpdateManyWithoutContactNestedInput = {
    create?: XOR<ActivityCreateWithoutContactInput, ActivityUncheckedCreateWithoutContactInput> | ActivityCreateWithoutContactInput[] | ActivityUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutContactInput | ActivityCreateOrConnectWithoutContactInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutContactInput | ActivityUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ActivityCreateManyContactInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutContactInput | ActivityUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutContactInput | ActivityUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type LeadUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<LeadCreateWithoutContactInput, LeadUncheckedCreateWithoutContactInput> | LeadCreateWithoutContactInput[] | LeadUncheckedCreateWithoutContactInput[]
    connectOrCreate?: LeadCreateOrConnectWithoutContactInput | LeadCreateOrConnectWithoutContactInput[]
    upsert?: LeadUpsertWithWhereUniqueWithoutContactInput | LeadUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: LeadCreateManyContactInputEnvelope
    set?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    disconnect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    delete?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    connect?: LeadWhereUniqueInput | LeadWhereUniqueInput[]
    update?: LeadUpdateWithWhereUniqueWithoutContactInput | LeadUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: LeadUpdateManyWithWhereWithoutContactInput | LeadUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: LeadScalarWhereInput | LeadScalarWhereInput[]
  }

  export type ActivityUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<ActivityCreateWithoutContactInput, ActivityUncheckedCreateWithoutContactInput> | ActivityCreateWithoutContactInput[] | ActivityUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutContactInput | ActivityCreateOrConnectWithoutContactInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutContactInput | ActivityUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ActivityCreateManyContactInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutContactInput | ActivityUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutContactInput | ActivityUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type TenantCreateNestedOneWithoutLeadsInput = {
    create?: XOR<TenantCreateWithoutLeadsInput, TenantUncheckedCreateWithoutLeadsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutLeadsInput
    connect?: TenantWhereUniqueInput
  }

  export type ContactCreateNestedOneWithoutLeadsInput = {
    create?: XOR<ContactCreateWithoutLeadsInput, ContactUncheckedCreateWithoutLeadsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutLeadsInput
    connect?: ContactWhereUniqueInput
  }

  export type ActivityCreateNestedManyWithoutLeadInput = {
    create?: XOR<ActivityCreateWithoutLeadInput, ActivityUncheckedCreateWithoutLeadInput> | ActivityCreateWithoutLeadInput[] | ActivityUncheckedCreateWithoutLeadInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutLeadInput | ActivityCreateOrConnectWithoutLeadInput[]
    createMany?: ActivityCreateManyLeadInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type ActivityUncheckedCreateNestedManyWithoutLeadInput = {
    create?: XOR<ActivityCreateWithoutLeadInput, ActivityUncheckedCreateWithoutLeadInput> | ActivityCreateWithoutLeadInput[] | ActivityUncheckedCreateWithoutLeadInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutLeadInput | ActivityCreateOrConnectWithoutLeadInput[]
    createMany?: ActivityCreateManyLeadInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TenantUpdateOneRequiredWithoutLeadsNestedInput = {
    create?: XOR<TenantCreateWithoutLeadsInput, TenantUncheckedCreateWithoutLeadsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutLeadsInput
    upsert?: TenantUpsertWithoutLeadsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutLeadsInput, TenantUpdateWithoutLeadsInput>, TenantUncheckedUpdateWithoutLeadsInput>
  }

  export type ContactUpdateOneWithoutLeadsNestedInput = {
    create?: XOR<ContactCreateWithoutLeadsInput, ContactUncheckedCreateWithoutLeadsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutLeadsInput
    upsert?: ContactUpsertWithoutLeadsInput
    disconnect?: ContactWhereInput | boolean
    delete?: ContactWhereInput | boolean
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutLeadsInput, ContactUpdateWithoutLeadsInput>, ContactUncheckedUpdateWithoutLeadsInput>
  }

  export type ActivityUpdateManyWithoutLeadNestedInput = {
    create?: XOR<ActivityCreateWithoutLeadInput, ActivityUncheckedCreateWithoutLeadInput> | ActivityCreateWithoutLeadInput[] | ActivityUncheckedCreateWithoutLeadInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutLeadInput | ActivityCreateOrConnectWithoutLeadInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutLeadInput | ActivityUpsertWithWhereUniqueWithoutLeadInput[]
    createMany?: ActivityCreateManyLeadInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutLeadInput | ActivityUpdateWithWhereUniqueWithoutLeadInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutLeadInput | ActivityUpdateManyWithWhereWithoutLeadInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type ActivityUncheckedUpdateManyWithoutLeadNestedInput = {
    create?: XOR<ActivityCreateWithoutLeadInput, ActivityUncheckedCreateWithoutLeadInput> | ActivityCreateWithoutLeadInput[] | ActivityUncheckedCreateWithoutLeadInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutLeadInput | ActivityCreateOrConnectWithoutLeadInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutLeadInput | ActivityUpsertWithWhereUniqueWithoutLeadInput[]
    createMany?: ActivityCreateManyLeadInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutLeadInput | ActivityUpdateWithWhereUniqueWithoutLeadInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutLeadInput | ActivityUpdateManyWithWhereWithoutLeadInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type TenantCreateNestedOneWithoutActivitiesInput = {
    create?: XOR<TenantCreateWithoutActivitiesInput, TenantUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: TenantCreateOrConnectWithoutActivitiesInput
    connect?: TenantWhereUniqueInput
  }

  export type ContactCreateNestedOneWithoutActivitiesInput = {
    create?: XOR<ContactCreateWithoutActivitiesInput, ContactUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: ContactCreateOrConnectWithoutActivitiesInput
    connect?: ContactWhereUniqueInput
  }

  export type LeadCreateNestedOneWithoutActivitiesInput = {
    create?: XOR<LeadCreateWithoutActivitiesInput, LeadUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: LeadCreateOrConnectWithoutActivitiesInput
    connect?: LeadWhereUniqueInput
  }

  export type TenantUpdateOneRequiredWithoutActivitiesNestedInput = {
    create?: XOR<TenantCreateWithoutActivitiesInput, TenantUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: TenantCreateOrConnectWithoutActivitiesInput
    upsert?: TenantUpsertWithoutActivitiesInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutActivitiesInput, TenantUpdateWithoutActivitiesInput>, TenantUncheckedUpdateWithoutActivitiesInput>
  }

  export type ContactUpdateOneWithoutActivitiesNestedInput = {
    create?: XOR<ContactCreateWithoutActivitiesInput, ContactUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: ContactCreateOrConnectWithoutActivitiesInput
    upsert?: ContactUpsertWithoutActivitiesInput
    disconnect?: ContactWhereInput | boolean
    delete?: ContactWhereInput | boolean
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutActivitiesInput, ContactUpdateWithoutActivitiesInput>, ContactUncheckedUpdateWithoutActivitiesInput>
  }

  export type LeadUpdateOneWithoutActivitiesNestedInput = {
    create?: XOR<LeadCreateWithoutActivitiesInput, LeadUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: LeadCreateOrConnectWithoutActivitiesInput
    upsert?: LeadUpsertWithoutActivitiesInput
    disconnect?: LeadWhereInput | boolean
    delete?: LeadWhereInput | boolean
    connect?: LeadWhereUniqueInput
    update?: XOR<XOR<LeadUpdateToOneWithWhereWithoutActivitiesInput, LeadUpdateWithoutActivitiesInput>, LeadUncheckedUpdateWithoutActivitiesInput>
  }

  export type TenantCreateNestedOneWithoutIngestedEventsInput = {
    create?: XOR<TenantCreateWithoutIngestedEventsInput, TenantUncheckedCreateWithoutIngestedEventsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutIngestedEventsInput
    connect?: TenantWhereUniqueInput
  }

  export type TenantUpdateOneRequiredWithoutIngestedEventsNestedInput = {
    create?: XOR<TenantCreateWithoutIngestedEventsInput, TenantUncheckedCreateWithoutIngestedEventsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutIngestedEventsInput
    upsert?: TenantUpsertWithoutIngestedEventsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutIngestedEventsInput, TenantUpdateWithoutIngestedEventsInput>, TenantUncheckedUpdateWithoutIngestedEventsInput>
  }

  export type TenantCreateNestedOneWithoutIngestionQueueJobsInput = {
    create?: XOR<TenantCreateWithoutIngestionQueueJobsInput, TenantUncheckedCreateWithoutIngestionQueueJobsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutIngestionQueueJobsInput
    connect?: TenantWhereUniqueInput
  }

  export type TenantUpdateOneRequiredWithoutIngestionQueueJobsNestedInput = {
    create?: XOR<TenantCreateWithoutIngestionQueueJobsInput, TenantUncheckedCreateWithoutIngestionQueueJobsInput>
    connectOrCreate?: TenantCreateOrConnectWithoutIngestionQueueJobsInput
    upsert?: TenantUpsertWithoutIngestionQueueJobsInput
    connect?: TenantWhereUniqueInput
    update?: XOR<XOR<TenantUpdateToOneWithWhereWithoutIngestionQueueJobsInput, TenantUpdateWithoutIngestionQueueJobsInput>, TenantUncheckedUpdateWithoutIngestionQueueJobsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type TenantDomainCreateWithoutTenantInput = {
    id: string
    hostname: string
    hostnameNormalized: string
    status?: string
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantDomainUncheckedCreateWithoutTenantInput = {
    id: string
    hostname: string
    hostnameNormalized: string
    status?: string
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantDomainCreateOrConnectWithoutTenantInput = {
    where: TenantDomainWhereUniqueInput
    create: XOR<TenantDomainCreateWithoutTenantInput, TenantDomainUncheckedCreateWithoutTenantInput>
  }

  export type TenantDomainCreateManyTenantInputEnvelope = {
    data: TenantDomainCreateManyTenantInput | TenantDomainCreateManyTenantInput[]
  }

  export type WebsiteConfigCreateWithoutTenantInput = {
    id: string
    createdAt: Date | string
    updatedAt: Date | string
    modules?: ModuleConfigCreateNestedManyWithoutWebsiteConfigInput
  }

  export type WebsiteConfigUncheckedCreateWithoutTenantInput = {
    id: string
    createdAt: Date | string
    updatedAt: Date | string
    modules?: ModuleConfigUncheckedCreateNestedManyWithoutWebsiteConfigInput
  }

  export type WebsiteConfigCreateOrConnectWithoutTenantInput = {
    where: WebsiteConfigWhereUniqueInput
    create: XOR<WebsiteConfigCreateWithoutTenantInput, WebsiteConfigUncheckedCreateWithoutTenantInput>
  }

  export type TenantControlSettingsCreateWithoutTenantInput = {
    id: string
    status?: string
    planCode?: string
    featureFlagsJson?: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlSettingsUncheckedCreateWithoutTenantInput = {
    id: string
    status?: string
    planCode?: string
    featureFlagsJson?: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlSettingsCreateOrConnectWithoutTenantInput = {
    where: TenantControlSettingsWhereUniqueInput
    create: XOR<TenantControlSettingsCreateWithoutTenantInput, TenantControlSettingsUncheckedCreateWithoutTenantInput>
  }

  export type TenantControlActorCreateWithoutTenantInput = {
    id: string
    actorId: string
    displayName?: string | null
    email?: string | null
    role: string
    permissionsJson?: string
    supportSessionActive?: boolean
    supportSessionStartedAt?: Date | string | null
    supportSessionExpiresAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlActorUncheckedCreateWithoutTenantInput = {
    id: string
    actorId: string
    displayName?: string | null
    email?: string | null
    role: string
    permissionsJson?: string
    supportSessionActive?: boolean
    supportSessionStartedAt?: Date | string | null
    supportSessionExpiresAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlActorCreateOrConnectWithoutTenantInput = {
    where: TenantControlActorWhereUniqueInput
    create: XOR<TenantControlActorCreateWithoutTenantInput, TenantControlActorUncheckedCreateWithoutTenantInput>
  }

  export type TenantControlActorCreateManyTenantInputEnvelope = {
    data: TenantControlActorCreateManyTenantInput | TenantControlActorCreateManyTenantInput[]
  }

  export type ContactCreateWithoutTenantInput = {
    id: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    leads?: LeadCreateNestedManyWithoutContactInput
    activities?: ActivityCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutTenantInput = {
    id: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    leads?: LeadUncheckedCreateNestedManyWithoutContactInput
    activities?: ActivityUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutTenantInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutTenantInput, ContactUncheckedCreateWithoutTenantInput>
  }

  export type ContactCreateManyTenantInputEnvelope = {
    data: ContactCreateManyTenantInput | ContactCreateManyTenantInput[]
  }

  export type LeadCreateWithoutTenantInput = {
    id: string
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    contact?: ContactCreateNestedOneWithoutLeadsInput
    activities?: ActivityCreateNestedManyWithoutLeadInput
  }

  export type LeadUncheckedCreateWithoutTenantInput = {
    id: string
    contactId?: string | null
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    activities?: ActivityUncheckedCreateNestedManyWithoutLeadInput
  }

  export type LeadCreateOrConnectWithoutTenantInput = {
    where: LeadWhereUniqueInput
    create: XOR<LeadCreateWithoutTenantInput, LeadUncheckedCreateWithoutTenantInput>
  }

  export type LeadCreateManyTenantInputEnvelope = {
    data: LeadCreateManyTenantInput | LeadCreateManyTenantInput[]
  }

  export type ActivityCreateWithoutTenantInput = {
    id: string
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
    contact?: ContactCreateNestedOneWithoutActivitiesInput
    lead?: LeadCreateNestedOneWithoutActivitiesInput
  }

  export type ActivityUncheckedCreateWithoutTenantInput = {
    id: string
    contactId?: string | null
    leadId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type ActivityCreateOrConnectWithoutTenantInput = {
    where: ActivityWhereUniqueInput
    create: XOR<ActivityCreateWithoutTenantInput, ActivityUncheckedCreateWithoutTenantInput>
  }

  export type ActivityCreateManyTenantInputEnvelope = {
    data: ActivityCreateManyTenantInput | ActivityCreateManyTenantInput[]
  }

  export type IngestedEventCreateWithoutTenantInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    processedAt: Date | string
    createdAt: Date | string
  }

  export type IngestedEventUncheckedCreateWithoutTenantInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    processedAt: Date | string
    createdAt: Date | string
  }

  export type IngestedEventCreateOrConnectWithoutTenantInput = {
    where: IngestedEventWhereUniqueInput
    create: XOR<IngestedEventCreateWithoutTenantInput, IngestedEventUncheckedCreateWithoutTenantInput>
  }

  export type IngestedEventCreateManyTenantInputEnvelope = {
    data: IngestedEventCreateManyTenantInput | IngestedEventCreateManyTenantInput[]
  }

  export type IngestionQueueJobCreateWithoutTenantInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    status: string
    attemptCount?: number
    lastError?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    processedAt?: Date | string | null
    nextAttemptAt?: Date | string
    deadLetteredAt?: Date | string | null
  }

  export type IngestionQueueJobUncheckedCreateWithoutTenantInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    status: string
    attemptCount?: number
    lastError?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    processedAt?: Date | string | null
    nextAttemptAt?: Date | string
    deadLetteredAt?: Date | string | null
  }

  export type IngestionQueueJobCreateOrConnectWithoutTenantInput = {
    where: IngestionQueueJobWhereUniqueInput
    create: XOR<IngestionQueueJobCreateWithoutTenantInput, IngestionQueueJobUncheckedCreateWithoutTenantInput>
  }

  export type IngestionQueueJobCreateManyTenantInputEnvelope = {
    data: IngestionQueueJobCreateManyTenantInput | IngestionQueueJobCreateManyTenantInput[]
  }

  export type TenantDomainUpsertWithWhereUniqueWithoutTenantInput = {
    where: TenantDomainWhereUniqueInput
    update: XOR<TenantDomainUpdateWithoutTenantInput, TenantDomainUncheckedUpdateWithoutTenantInput>
    create: XOR<TenantDomainCreateWithoutTenantInput, TenantDomainUncheckedCreateWithoutTenantInput>
  }

  export type TenantDomainUpdateWithWhereUniqueWithoutTenantInput = {
    where: TenantDomainWhereUniqueInput
    data: XOR<TenantDomainUpdateWithoutTenantInput, TenantDomainUncheckedUpdateWithoutTenantInput>
  }

  export type TenantDomainUpdateManyWithWhereWithoutTenantInput = {
    where: TenantDomainScalarWhereInput
    data: XOR<TenantDomainUpdateManyMutationInput, TenantDomainUncheckedUpdateManyWithoutTenantInput>
  }

  export type TenantDomainScalarWhereInput = {
    AND?: TenantDomainScalarWhereInput | TenantDomainScalarWhereInput[]
    OR?: TenantDomainScalarWhereInput[]
    NOT?: TenantDomainScalarWhereInput | TenantDomainScalarWhereInput[]
    id?: StringFilter<"TenantDomain"> | string
    tenantId?: StringFilter<"TenantDomain"> | string
    hostname?: StringFilter<"TenantDomain"> | string
    hostnameNormalized?: StringFilter<"TenantDomain"> | string
    status?: StringFilter<"TenantDomain"> | string
    isPrimary?: BoolFilter<"TenantDomain"> | boolean
    isVerified?: BoolFilter<"TenantDomain"> | boolean
    verifiedAt?: DateTimeNullableFilter<"TenantDomain"> | Date | string | null
    createdAt?: DateTimeFilter<"TenantDomain"> | Date | string
    updatedAt?: DateTimeFilter<"TenantDomain"> | Date | string
  }

  export type WebsiteConfigUpsertWithoutTenantInput = {
    update: XOR<WebsiteConfigUpdateWithoutTenantInput, WebsiteConfigUncheckedUpdateWithoutTenantInput>
    create: XOR<WebsiteConfigCreateWithoutTenantInput, WebsiteConfigUncheckedCreateWithoutTenantInput>
    where?: WebsiteConfigWhereInput
  }

  export type WebsiteConfigUpdateToOneWithWhereWithoutTenantInput = {
    where?: WebsiteConfigWhereInput
    data: XOR<WebsiteConfigUpdateWithoutTenantInput, WebsiteConfigUncheckedUpdateWithoutTenantInput>
  }

  export type WebsiteConfigUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modules?: ModuleConfigUpdateManyWithoutWebsiteConfigNestedInput
  }

  export type WebsiteConfigUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modules?: ModuleConfigUncheckedUpdateManyWithoutWebsiteConfigNestedInput
  }

  export type TenantControlSettingsUpsertWithoutTenantInput = {
    update: XOR<TenantControlSettingsUpdateWithoutTenantInput, TenantControlSettingsUncheckedUpdateWithoutTenantInput>
    create: XOR<TenantControlSettingsCreateWithoutTenantInput, TenantControlSettingsUncheckedCreateWithoutTenantInput>
    where?: TenantControlSettingsWhereInput
  }

  export type TenantControlSettingsUpdateToOneWithWhereWithoutTenantInput = {
    where?: TenantControlSettingsWhereInput
    data: XOR<TenantControlSettingsUpdateWithoutTenantInput, TenantControlSettingsUncheckedUpdateWithoutTenantInput>
  }

  export type TenantControlSettingsUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    planCode?: StringFieldUpdateOperationsInput | string
    featureFlagsJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlSettingsUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    planCode?: StringFieldUpdateOperationsInput | string
    featureFlagsJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorUpsertWithWhereUniqueWithoutTenantInput = {
    where: TenantControlActorWhereUniqueInput
    update: XOR<TenantControlActorUpdateWithoutTenantInput, TenantControlActorUncheckedUpdateWithoutTenantInput>
    create: XOR<TenantControlActorCreateWithoutTenantInput, TenantControlActorUncheckedCreateWithoutTenantInput>
  }

  export type TenantControlActorUpdateWithWhereUniqueWithoutTenantInput = {
    where: TenantControlActorWhereUniqueInput
    data: XOR<TenantControlActorUpdateWithoutTenantInput, TenantControlActorUncheckedUpdateWithoutTenantInput>
  }

  export type TenantControlActorUpdateManyWithWhereWithoutTenantInput = {
    where: TenantControlActorScalarWhereInput
    data: XOR<TenantControlActorUpdateManyMutationInput, TenantControlActorUncheckedUpdateManyWithoutTenantInput>
  }

  export type TenantControlActorScalarWhereInput = {
    AND?: TenantControlActorScalarWhereInput | TenantControlActorScalarWhereInput[]
    OR?: TenantControlActorScalarWhereInput[]
    NOT?: TenantControlActorScalarWhereInput | TenantControlActorScalarWhereInput[]
    id?: StringFilter<"TenantControlActor"> | string
    tenantId?: StringFilter<"TenantControlActor"> | string
    actorId?: StringFilter<"TenantControlActor"> | string
    displayName?: StringNullableFilter<"TenantControlActor"> | string | null
    email?: StringNullableFilter<"TenantControlActor"> | string | null
    role?: StringFilter<"TenantControlActor"> | string
    permissionsJson?: StringFilter<"TenantControlActor"> | string
    supportSessionActive?: BoolFilter<"TenantControlActor"> | boolean
    supportSessionStartedAt?: DateTimeNullableFilter<"TenantControlActor"> | Date | string | null
    supportSessionExpiresAt?: DateTimeNullableFilter<"TenantControlActor"> | Date | string | null
    createdAt?: DateTimeFilter<"TenantControlActor"> | Date | string
    updatedAt?: DateTimeFilter<"TenantControlActor"> | Date | string
  }

  export type ContactUpsertWithWhereUniqueWithoutTenantInput = {
    where: ContactWhereUniqueInput
    update: XOR<ContactUpdateWithoutTenantInput, ContactUncheckedUpdateWithoutTenantInput>
    create: XOR<ContactCreateWithoutTenantInput, ContactUncheckedCreateWithoutTenantInput>
  }

  export type ContactUpdateWithWhereUniqueWithoutTenantInput = {
    where: ContactWhereUniqueInput
    data: XOR<ContactUpdateWithoutTenantInput, ContactUncheckedUpdateWithoutTenantInput>
  }

  export type ContactUpdateManyWithWhereWithoutTenantInput = {
    where: ContactScalarWhereInput
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyWithoutTenantInput>
  }

  export type ContactScalarWhereInput = {
    AND?: ContactScalarWhereInput | ContactScalarWhereInput[]
    OR?: ContactScalarWhereInput[]
    NOT?: ContactScalarWhereInput | ContactScalarWhereInput[]
    id?: StringFilter<"Contact"> | string
    tenantId?: StringFilter<"Contact"> | string
    fullName?: StringNullableFilter<"Contact"> | string | null
    email?: StringNullableFilter<"Contact"> | string | null
    emailNormalized?: StringNullableFilter<"Contact"> | string | null
    phone?: StringNullableFilter<"Contact"> | string | null
    phoneNormalized?: StringNullableFilter<"Contact"> | string | null
    source?: StringFilter<"Contact"> | string
    createdAt?: DateTimeFilter<"Contact"> | Date | string
    updatedAt?: DateTimeFilter<"Contact"> | Date | string
  }

  export type LeadUpsertWithWhereUniqueWithoutTenantInput = {
    where: LeadWhereUniqueInput
    update: XOR<LeadUpdateWithoutTenantInput, LeadUncheckedUpdateWithoutTenantInput>
    create: XOR<LeadCreateWithoutTenantInput, LeadUncheckedCreateWithoutTenantInput>
  }

  export type LeadUpdateWithWhereUniqueWithoutTenantInput = {
    where: LeadWhereUniqueInput
    data: XOR<LeadUpdateWithoutTenantInput, LeadUncheckedUpdateWithoutTenantInput>
  }

  export type LeadUpdateManyWithWhereWithoutTenantInput = {
    where: LeadScalarWhereInput
    data: XOR<LeadUpdateManyMutationInput, LeadUncheckedUpdateManyWithoutTenantInput>
  }

  export type LeadScalarWhereInput = {
    AND?: LeadScalarWhereInput | LeadScalarWhereInput[]
    OR?: LeadScalarWhereInput[]
    NOT?: LeadScalarWhereInput | LeadScalarWhereInput[]
    id?: StringFilter<"Lead"> | string
    tenantId?: StringFilter<"Lead"> | string
    contactId?: StringNullableFilter<"Lead"> | string | null
    status?: StringFilter<"Lead"> | string
    leadType?: StringFilter<"Lead"> | string
    source?: StringFilter<"Lead"> | string
    timeframe?: StringNullableFilter<"Lead"> | string | null
    notes?: StringNullableFilter<"Lead"> | string | null
    listingId?: StringNullableFilter<"Lead"> | string | null
    listingUrl?: StringNullableFilter<"Lead"> | string | null
    listingAddress?: StringNullableFilter<"Lead"> | string | null
    propertyType?: StringNullableFilter<"Lead"> | string | null
    beds?: IntNullableFilter<"Lead"> | number | null
    baths?: IntNullableFilter<"Lead"> | number | null
    sqft?: IntNullableFilter<"Lead"> | number | null
    createdAt?: DateTimeFilter<"Lead"> | Date | string
    updatedAt?: DateTimeFilter<"Lead"> | Date | string
  }

  export type ActivityUpsertWithWhereUniqueWithoutTenantInput = {
    where: ActivityWhereUniqueInput
    update: XOR<ActivityUpdateWithoutTenantInput, ActivityUncheckedUpdateWithoutTenantInput>
    create: XOR<ActivityCreateWithoutTenantInput, ActivityUncheckedCreateWithoutTenantInput>
  }

  export type ActivityUpdateWithWhereUniqueWithoutTenantInput = {
    where: ActivityWhereUniqueInput
    data: XOR<ActivityUpdateWithoutTenantInput, ActivityUncheckedUpdateWithoutTenantInput>
  }

  export type ActivityUpdateManyWithWhereWithoutTenantInput = {
    where: ActivityScalarWhereInput
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyWithoutTenantInput>
  }

  export type ActivityScalarWhereInput = {
    AND?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
    OR?: ActivityScalarWhereInput[]
    NOT?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
    id?: StringFilter<"Activity"> | string
    tenantId?: StringFilter<"Activity"> | string
    contactId?: StringNullableFilter<"Activity"> | string | null
    leadId?: StringNullableFilter<"Activity"> | string | null
    activityType?: StringFilter<"Activity"> | string
    occurredAt?: DateTimeFilter<"Activity"> | Date | string
    summary?: StringFilter<"Activity"> | string
    metadataJson?: StringNullableFilter<"Activity"> | string | null
    createdAt?: DateTimeFilter<"Activity"> | Date | string
  }

  export type IngestedEventUpsertWithWhereUniqueWithoutTenantInput = {
    where: IngestedEventWhereUniqueInput
    update: XOR<IngestedEventUpdateWithoutTenantInput, IngestedEventUncheckedUpdateWithoutTenantInput>
    create: XOR<IngestedEventCreateWithoutTenantInput, IngestedEventUncheckedCreateWithoutTenantInput>
  }

  export type IngestedEventUpdateWithWhereUniqueWithoutTenantInput = {
    where: IngestedEventWhereUniqueInput
    data: XOR<IngestedEventUpdateWithoutTenantInput, IngestedEventUncheckedUpdateWithoutTenantInput>
  }

  export type IngestedEventUpdateManyWithWhereWithoutTenantInput = {
    where: IngestedEventScalarWhereInput
    data: XOR<IngestedEventUpdateManyMutationInput, IngestedEventUncheckedUpdateManyWithoutTenantInput>
  }

  export type IngestedEventScalarWhereInput = {
    AND?: IngestedEventScalarWhereInput | IngestedEventScalarWhereInput[]
    OR?: IngestedEventScalarWhereInput[]
    NOT?: IngestedEventScalarWhereInput | IngestedEventScalarWhereInput[]
    id?: StringFilter<"IngestedEvent"> | string
    tenantId?: StringFilter<"IngestedEvent"> | string
    eventType?: StringFilter<"IngestedEvent"> | string
    eventKey?: StringFilter<"IngestedEvent"> | string
    occurredAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    payloadJson?: StringFilter<"IngestedEvent"> | string
    processedAt?: DateTimeFilter<"IngestedEvent"> | Date | string
    createdAt?: DateTimeFilter<"IngestedEvent"> | Date | string
  }

  export type IngestionQueueJobUpsertWithWhereUniqueWithoutTenantInput = {
    where: IngestionQueueJobWhereUniqueInput
    update: XOR<IngestionQueueJobUpdateWithoutTenantInput, IngestionQueueJobUncheckedUpdateWithoutTenantInput>
    create: XOR<IngestionQueueJobCreateWithoutTenantInput, IngestionQueueJobUncheckedCreateWithoutTenantInput>
  }

  export type IngestionQueueJobUpdateWithWhereUniqueWithoutTenantInput = {
    where: IngestionQueueJobWhereUniqueInput
    data: XOR<IngestionQueueJobUpdateWithoutTenantInput, IngestionQueueJobUncheckedUpdateWithoutTenantInput>
  }

  export type IngestionQueueJobUpdateManyWithWhereWithoutTenantInput = {
    where: IngestionQueueJobScalarWhereInput
    data: XOR<IngestionQueueJobUpdateManyMutationInput, IngestionQueueJobUncheckedUpdateManyWithoutTenantInput>
  }

  export type IngestionQueueJobScalarWhereInput = {
    AND?: IngestionQueueJobScalarWhereInput | IngestionQueueJobScalarWhereInput[]
    OR?: IngestionQueueJobScalarWhereInput[]
    NOT?: IngestionQueueJobScalarWhereInput | IngestionQueueJobScalarWhereInput[]
    id?: StringFilter<"IngestionQueueJob"> | string
    tenantId?: StringFilter<"IngestionQueueJob"> | string
    eventType?: StringFilter<"IngestionQueueJob"> | string
    eventKey?: StringFilter<"IngestionQueueJob"> | string
    occurredAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    payloadJson?: StringFilter<"IngestionQueueJob"> | string
    status?: StringFilter<"IngestionQueueJob"> | string
    attemptCount?: IntFilter<"IngestionQueueJob"> | number
    lastError?: StringNullableFilter<"IngestionQueueJob"> | string | null
    createdAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    updatedAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    processedAt?: DateTimeNullableFilter<"IngestionQueueJob"> | Date | string | null
    nextAttemptAt?: DateTimeFilter<"IngestionQueueJob"> | Date | string
    deadLetteredAt?: DateTimeNullableFilter<"IngestionQueueJob"> | Date | string | null
  }

  export type TenantCreateWithoutDomainsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutDomainsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutDomainsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutDomainsInput, TenantUncheckedCreateWithoutDomainsInput>
  }

  export type TenantUpsertWithoutDomainsInput = {
    update: XOR<TenantUpdateWithoutDomainsInput, TenantUncheckedUpdateWithoutDomainsInput>
    create: XOR<TenantCreateWithoutDomainsInput, TenantUncheckedCreateWithoutDomainsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutDomainsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutDomainsInput, TenantUncheckedUpdateWithoutDomainsInput>
  }

  export type TenantUpdateWithoutDomainsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutDomainsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type TenantCreateWithoutWebsiteConfigInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutWebsiteConfigInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutWebsiteConfigInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutWebsiteConfigInput, TenantUncheckedCreateWithoutWebsiteConfigInput>
  }

  export type ModuleConfigCreateWithoutWebsiteConfigInput = {
    id: string
    tenantId: string
    moduleKey: string
    enabled?: boolean
    sortOrder?: number
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ModuleConfigUncheckedCreateWithoutWebsiteConfigInput = {
    id: string
    tenantId: string
    moduleKey: string
    enabled?: boolean
    sortOrder?: number
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ModuleConfigCreateOrConnectWithoutWebsiteConfigInput = {
    where: ModuleConfigWhereUniqueInput
    create: XOR<ModuleConfigCreateWithoutWebsiteConfigInput, ModuleConfigUncheckedCreateWithoutWebsiteConfigInput>
  }

  export type ModuleConfigCreateManyWebsiteConfigInputEnvelope = {
    data: ModuleConfigCreateManyWebsiteConfigInput | ModuleConfigCreateManyWebsiteConfigInput[]
  }

  export type TenantUpsertWithoutWebsiteConfigInput = {
    update: XOR<TenantUpdateWithoutWebsiteConfigInput, TenantUncheckedUpdateWithoutWebsiteConfigInput>
    create: XOR<TenantCreateWithoutWebsiteConfigInput, TenantUncheckedCreateWithoutWebsiteConfigInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutWebsiteConfigInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutWebsiteConfigInput, TenantUncheckedUpdateWithoutWebsiteConfigInput>
  }

  export type TenantUpdateWithoutWebsiteConfigInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutWebsiteConfigInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type ModuleConfigUpsertWithWhereUniqueWithoutWebsiteConfigInput = {
    where: ModuleConfigWhereUniqueInput
    update: XOR<ModuleConfigUpdateWithoutWebsiteConfigInput, ModuleConfigUncheckedUpdateWithoutWebsiteConfigInput>
    create: XOR<ModuleConfigCreateWithoutWebsiteConfigInput, ModuleConfigUncheckedCreateWithoutWebsiteConfigInput>
  }

  export type ModuleConfigUpdateWithWhereUniqueWithoutWebsiteConfigInput = {
    where: ModuleConfigWhereUniqueInput
    data: XOR<ModuleConfigUpdateWithoutWebsiteConfigInput, ModuleConfigUncheckedUpdateWithoutWebsiteConfigInput>
  }

  export type ModuleConfigUpdateManyWithWhereWithoutWebsiteConfigInput = {
    where: ModuleConfigScalarWhereInput
    data: XOR<ModuleConfigUpdateManyMutationInput, ModuleConfigUncheckedUpdateManyWithoutWebsiteConfigInput>
  }

  export type ModuleConfigScalarWhereInput = {
    AND?: ModuleConfigScalarWhereInput | ModuleConfigScalarWhereInput[]
    OR?: ModuleConfigScalarWhereInput[]
    NOT?: ModuleConfigScalarWhereInput | ModuleConfigScalarWhereInput[]
    id?: StringFilter<"ModuleConfig"> | string
    websiteConfigId?: StringFilter<"ModuleConfig"> | string
    tenantId?: StringFilter<"ModuleConfig"> | string
    moduleKey?: StringFilter<"ModuleConfig"> | string
    enabled?: BoolFilter<"ModuleConfig"> | boolean
    sortOrder?: IntFilter<"ModuleConfig"> | number
    createdAt?: DateTimeFilter<"ModuleConfig"> | Date | string
    updatedAt?: DateTimeFilter<"ModuleConfig"> | Date | string
  }

  export type TenantCreateWithoutControlSettingsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutControlSettingsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutControlSettingsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutControlSettingsInput, TenantUncheckedCreateWithoutControlSettingsInput>
  }

  export type TenantUpsertWithoutControlSettingsInput = {
    update: XOR<TenantUpdateWithoutControlSettingsInput, TenantUncheckedUpdateWithoutControlSettingsInput>
    create: XOR<TenantCreateWithoutControlSettingsInput, TenantUncheckedCreateWithoutControlSettingsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutControlSettingsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutControlSettingsInput, TenantUncheckedUpdateWithoutControlSettingsInput>
  }

  export type TenantUpdateWithoutControlSettingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutControlSettingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type TenantCreateWithoutControlActorsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutControlActorsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutControlActorsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutControlActorsInput, TenantUncheckedCreateWithoutControlActorsInput>
  }

  export type TenantUpsertWithoutControlActorsInput = {
    update: XOR<TenantUpdateWithoutControlActorsInput, TenantUncheckedUpdateWithoutControlActorsInput>
    create: XOR<TenantCreateWithoutControlActorsInput, TenantUncheckedCreateWithoutControlActorsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutControlActorsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutControlActorsInput, TenantUncheckedUpdateWithoutControlActorsInput>
  }

  export type TenantUpdateWithoutControlActorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutControlActorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type WebsiteConfigCreateWithoutModulesInput = {
    id: string
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutWebsiteConfigInput
  }

  export type WebsiteConfigUncheckedCreateWithoutModulesInput = {
    id: string
    tenantId: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type WebsiteConfigCreateOrConnectWithoutModulesInput = {
    where: WebsiteConfigWhereUniqueInput
    create: XOR<WebsiteConfigCreateWithoutModulesInput, WebsiteConfigUncheckedCreateWithoutModulesInput>
  }

  export type WebsiteConfigUpsertWithoutModulesInput = {
    update: XOR<WebsiteConfigUpdateWithoutModulesInput, WebsiteConfigUncheckedUpdateWithoutModulesInput>
    create: XOR<WebsiteConfigCreateWithoutModulesInput, WebsiteConfigUncheckedCreateWithoutModulesInput>
    where?: WebsiteConfigWhereInput
  }

  export type WebsiteConfigUpdateToOneWithWhereWithoutModulesInput = {
    where?: WebsiteConfigWhereInput
    data: XOR<WebsiteConfigUpdateWithoutModulesInput, WebsiteConfigUncheckedUpdateWithoutModulesInput>
  }

  export type WebsiteConfigUpdateWithoutModulesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutWebsiteConfigNestedInput
  }

  export type WebsiteConfigUncheckedUpdateWithoutModulesInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantCreateWithoutContactsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutContactsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutContactsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutContactsInput, TenantUncheckedCreateWithoutContactsInput>
  }

  export type LeadCreateWithoutContactInput = {
    id: string
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutLeadsInput
    activities?: ActivityCreateNestedManyWithoutLeadInput
  }

  export type LeadUncheckedCreateWithoutContactInput = {
    id: string
    tenantId: string
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    activities?: ActivityUncheckedCreateNestedManyWithoutLeadInput
  }

  export type LeadCreateOrConnectWithoutContactInput = {
    where: LeadWhereUniqueInput
    create: XOR<LeadCreateWithoutContactInput, LeadUncheckedCreateWithoutContactInput>
  }

  export type LeadCreateManyContactInputEnvelope = {
    data: LeadCreateManyContactInput | LeadCreateManyContactInput[]
  }

  export type ActivityCreateWithoutContactInput = {
    id: string
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
    tenant: TenantCreateNestedOneWithoutActivitiesInput
    lead?: LeadCreateNestedOneWithoutActivitiesInput
  }

  export type ActivityUncheckedCreateWithoutContactInput = {
    id: string
    tenantId: string
    leadId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type ActivityCreateOrConnectWithoutContactInput = {
    where: ActivityWhereUniqueInput
    create: XOR<ActivityCreateWithoutContactInput, ActivityUncheckedCreateWithoutContactInput>
  }

  export type ActivityCreateManyContactInputEnvelope = {
    data: ActivityCreateManyContactInput | ActivityCreateManyContactInput[]
  }

  export type TenantUpsertWithoutContactsInput = {
    update: XOR<TenantUpdateWithoutContactsInput, TenantUncheckedUpdateWithoutContactsInput>
    create: XOR<TenantCreateWithoutContactsInput, TenantUncheckedCreateWithoutContactsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutContactsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutContactsInput, TenantUncheckedUpdateWithoutContactsInput>
  }

  export type TenantUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type LeadUpsertWithWhereUniqueWithoutContactInput = {
    where: LeadWhereUniqueInput
    update: XOR<LeadUpdateWithoutContactInput, LeadUncheckedUpdateWithoutContactInput>
    create: XOR<LeadCreateWithoutContactInput, LeadUncheckedCreateWithoutContactInput>
  }

  export type LeadUpdateWithWhereUniqueWithoutContactInput = {
    where: LeadWhereUniqueInput
    data: XOR<LeadUpdateWithoutContactInput, LeadUncheckedUpdateWithoutContactInput>
  }

  export type LeadUpdateManyWithWhereWithoutContactInput = {
    where: LeadScalarWhereInput
    data: XOR<LeadUpdateManyMutationInput, LeadUncheckedUpdateManyWithoutContactInput>
  }

  export type ActivityUpsertWithWhereUniqueWithoutContactInput = {
    where: ActivityWhereUniqueInput
    update: XOR<ActivityUpdateWithoutContactInput, ActivityUncheckedUpdateWithoutContactInput>
    create: XOR<ActivityCreateWithoutContactInput, ActivityUncheckedCreateWithoutContactInput>
  }

  export type ActivityUpdateWithWhereUniqueWithoutContactInput = {
    where: ActivityWhereUniqueInput
    data: XOR<ActivityUpdateWithoutContactInput, ActivityUncheckedUpdateWithoutContactInput>
  }

  export type ActivityUpdateManyWithWhereWithoutContactInput = {
    where: ActivityScalarWhereInput
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyWithoutContactInput>
  }

  export type TenantCreateWithoutLeadsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutLeadsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutLeadsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutLeadsInput, TenantUncheckedCreateWithoutLeadsInput>
  }

  export type ContactCreateWithoutLeadsInput = {
    id: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutContactsInput
    activities?: ActivityCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutLeadsInput = {
    id: string
    tenantId: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    activities?: ActivityUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutLeadsInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutLeadsInput, ContactUncheckedCreateWithoutLeadsInput>
  }

  export type ActivityCreateWithoutLeadInput = {
    id: string
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
    tenant: TenantCreateNestedOneWithoutActivitiesInput
    contact?: ContactCreateNestedOneWithoutActivitiesInput
  }

  export type ActivityUncheckedCreateWithoutLeadInput = {
    id: string
    tenantId: string
    contactId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type ActivityCreateOrConnectWithoutLeadInput = {
    where: ActivityWhereUniqueInput
    create: XOR<ActivityCreateWithoutLeadInput, ActivityUncheckedCreateWithoutLeadInput>
  }

  export type ActivityCreateManyLeadInputEnvelope = {
    data: ActivityCreateManyLeadInput | ActivityCreateManyLeadInput[]
  }

  export type TenantUpsertWithoutLeadsInput = {
    update: XOR<TenantUpdateWithoutLeadsInput, TenantUncheckedUpdateWithoutLeadsInput>
    create: XOR<TenantCreateWithoutLeadsInput, TenantUncheckedCreateWithoutLeadsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutLeadsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutLeadsInput, TenantUncheckedUpdateWithoutLeadsInput>
  }

  export type TenantUpdateWithoutLeadsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutLeadsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type ContactUpsertWithoutLeadsInput = {
    update: XOR<ContactUpdateWithoutLeadsInput, ContactUncheckedUpdateWithoutLeadsInput>
    create: XOR<ContactCreateWithoutLeadsInput, ContactUncheckedCreateWithoutLeadsInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutLeadsInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutLeadsInput, ContactUncheckedUpdateWithoutLeadsInput>
  }

  export type ContactUpdateWithoutLeadsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutContactsNestedInput
    activities?: ActivityUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutLeadsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: ActivityUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ActivityUpsertWithWhereUniqueWithoutLeadInput = {
    where: ActivityWhereUniqueInput
    update: XOR<ActivityUpdateWithoutLeadInput, ActivityUncheckedUpdateWithoutLeadInput>
    create: XOR<ActivityCreateWithoutLeadInput, ActivityUncheckedCreateWithoutLeadInput>
  }

  export type ActivityUpdateWithWhereUniqueWithoutLeadInput = {
    where: ActivityWhereUniqueInput
    data: XOR<ActivityUpdateWithoutLeadInput, ActivityUncheckedUpdateWithoutLeadInput>
  }

  export type ActivityUpdateManyWithWhereWithoutLeadInput = {
    where: ActivityScalarWhereInput
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyWithoutLeadInput>
  }

  export type TenantCreateWithoutActivitiesInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutActivitiesInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutActivitiesInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutActivitiesInput, TenantUncheckedCreateWithoutActivitiesInput>
  }

  export type ContactCreateWithoutActivitiesInput = {
    id: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutContactsInput
    leads?: LeadCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutActivitiesInput = {
    id: string
    tenantId: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
    leads?: LeadUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutActivitiesInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutActivitiesInput, ContactUncheckedCreateWithoutActivitiesInput>
  }

  export type LeadCreateWithoutActivitiesInput = {
    id: string
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
    tenant: TenantCreateNestedOneWithoutLeadsInput
    contact?: ContactCreateNestedOneWithoutLeadsInput
  }

  export type LeadUncheckedCreateWithoutActivitiesInput = {
    id: string
    tenantId: string
    contactId?: string | null
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type LeadCreateOrConnectWithoutActivitiesInput = {
    where: LeadWhereUniqueInput
    create: XOR<LeadCreateWithoutActivitiesInput, LeadUncheckedCreateWithoutActivitiesInput>
  }

  export type TenantUpsertWithoutActivitiesInput = {
    update: XOR<TenantUpdateWithoutActivitiesInput, TenantUncheckedUpdateWithoutActivitiesInput>
    create: XOR<TenantCreateWithoutActivitiesInput, TenantUncheckedCreateWithoutActivitiesInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutActivitiesInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutActivitiesInput, TenantUncheckedUpdateWithoutActivitiesInput>
  }

  export type TenantUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type ContactUpsertWithoutActivitiesInput = {
    update: XOR<ContactUpdateWithoutActivitiesInput, ContactUncheckedUpdateWithoutActivitiesInput>
    create: XOR<ContactCreateWithoutActivitiesInput, ContactUncheckedCreateWithoutActivitiesInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutActivitiesInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutActivitiesInput, ContactUncheckedUpdateWithoutActivitiesInput>
  }

  export type ContactUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutContactsNestedInput
    leads?: LeadUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leads?: LeadUncheckedUpdateManyWithoutContactNestedInput
  }

  export type LeadUpsertWithoutActivitiesInput = {
    update: XOR<LeadUpdateWithoutActivitiesInput, LeadUncheckedUpdateWithoutActivitiesInput>
    create: XOR<LeadCreateWithoutActivitiesInput, LeadUncheckedCreateWithoutActivitiesInput>
    where?: LeadWhereInput
  }

  export type LeadUpdateToOneWithWhereWithoutActivitiesInput = {
    where?: LeadWhereInput
    data: XOR<LeadUpdateWithoutActivitiesInput, LeadUncheckedUpdateWithoutActivitiesInput>
  }

  export type LeadUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutLeadsNestedInput
    contact?: ContactUpdateOneWithoutLeadsNestedInput
  }

  export type LeadUncheckedUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantCreateWithoutIngestedEventsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutIngestedEventsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutIngestedEventsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutIngestedEventsInput, TenantUncheckedCreateWithoutIngestedEventsInput>
  }

  export type TenantUpsertWithoutIngestedEventsInput = {
    update: XOR<TenantUpdateWithoutIngestedEventsInput, TenantUncheckedUpdateWithoutIngestedEventsInput>
    create: XOR<TenantCreateWithoutIngestedEventsInput, TenantUncheckedCreateWithoutIngestedEventsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutIngestedEventsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutIngestedEventsInput, TenantUncheckedUpdateWithoutIngestedEventsInput>
  }

  export type TenantUpdateWithoutIngestedEventsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutIngestedEventsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestionQueueJobs?: IngestionQueueJobUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type TenantCreateWithoutIngestionQueueJobsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorCreateNestedManyWithoutTenantInput
    contacts?: ContactCreateNestedManyWithoutTenantInput
    leads?: LeadCreateNestedManyWithoutTenantInput
    activities?: ActivityCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventCreateNestedManyWithoutTenantInput
  }

  export type TenantUncheckedCreateWithoutIngestionQueueJobsInput = {
    id: string
    slug: string
    name: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    domains?: TenantDomainUncheckedCreateNestedManyWithoutTenantInput
    websiteConfig?: WebsiteConfigUncheckedCreateNestedOneWithoutTenantInput
    controlSettings?: TenantControlSettingsUncheckedCreateNestedOneWithoutTenantInput
    controlActors?: TenantControlActorUncheckedCreateNestedManyWithoutTenantInput
    contacts?: ContactUncheckedCreateNestedManyWithoutTenantInput
    leads?: LeadUncheckedCreateNestedManyWithoutTenantInput
    activities?: ActivityUncheckedCreateNestedManyWithoutTenantInput
    ingestedEvents?: IngestedEventUncheckedCreateNestedManyWithoutTenantInput
  }

  export type TenantCreateOrConnectWithoutIngestionQueueJobsInput = {
    where: TenantWhereUniqueInput
    create: XOR<TenantCreateWithoutIngestionQueueJobsInput, TenantUncheckedCreateWithoutIngestionQueueJobsInput>
  }

  export type TenantUpsertWithoutIngestionQueueJobsInput = {
    update: XOR<TenantUpdateWithoutIngestionQueueJobsInput, TenantUncheckedUpdateWithoutIngestionQueueJobsInput>
    create: XOR<TenantCreateWithoutIngestionQueueJobsInput, TenantUncheckedCreateWithoutIngestionQueueJobsInput>
    where?: TenantWhereInput
  }

  export type TenantUpdateToOneWithWhereWithoutIngestionQueueJobsInput = {
    where?: TenantWhereInput
    data: XOR<TenantUpdateWithoutIngestionQueueJobsInput, TenantUncheckedUpdateWithoutIngestionQueueJobsInput>
  }

  export type TenantUpdateWithoutIngestionQueueJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUpdateManyWithoutTenantNestedInput
    contacts?: ContactUpdateManyWithoutTenantNestedInput
    leads?: LeadUpdateManyWithoutTenantNestedInput
    activities?: ActivityUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUpdateManyWithoutTenantNestedInput
  }

  export type TenantUncheckedUpdateWithoutIngestionQueueJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: TenantDomainUncheckedUpdateManyWithoutTenantNestedInput
    websiteConfig?: WebsiteConfigUncheckedUpdateOneWithoutTenantNestedInput
    controlSettings?: TenantControlSettingsUncheckedUpdateOneWithoutTenantNestedInput
    controlActors?: TenantControlActorUncheckedUpdateManyWithoutTenantNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutTenantNestedInput
    leads?: LeadUncheckedUpdateManyWithoutTenantNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutTenantNestedInput
    ingestedEvents?: IngestedEventUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type TenantDomainCreateManyTenantInput = {
    id: string
    hostname: string
    hostnameNormalized: string
    status?: string
    isPrimary?: boolean
    isVerified?: boolean
    verifiedAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type TenantControlActorCreateManyTenantInput = {
    id: string
    actorId: string
    displayName?: string | null
    email?: string | null
    role: string
    permissionsJson?: string
    supportSessionActive?: boolean
    supportSessionStartedAt?: Date | string | null
    supportSessionExpiresAt?: Date | string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ContactCreateManyTenantInput = {
    id: string
    fullName?: string | null
    email?: string | null
    emailNormalized?: string | null
    phone?: string | null
    phoneNormalized?: string | null
    source: string
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type LeadCreateManyTenantInput = {
    id: string
    contactId?: string | null
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ActivityCreateManyTenantInput = {
    id: string
    contactId?: string | null
    leadId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type IngestedEventCreateManyTenantInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    processedAt: Date | string
    createdAt: Date | string
  }

  export type IngestionQueueJobCreateManyTenantInput = {
    id: string
    eventType: string
    eventKey: string
    occurredAt: Date | string
    payloadJson: string
    status: string
    attemptCount?: number
    lastError?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    processedAt?: Date | string | null
    nextAttemptAt?: Date | string
    deadLetteredAt?: Date | string | null
  }

  export type TenantDomainUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantDomainUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantDomainUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostname?: StringFieldUpdateOperationsInput | string
    hostnameNormalized?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TenantControlActorUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    permissionsJson?: StringFieldUpdateOperationsInput | string
    supportSessionActive?: BoolFieldUpdateOperationsInput | boolean
    supportSessionStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    supportSessionExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leads?: LeadUpdateManyWithoutContactNestedInput
    activities?: ActivityUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leads?: LeadUncheckedUpdateManyWithoutContactNestedInput
    activities?: ActivityUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    fullName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeadUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneWithoutLeadsNestedInput
    activities?: ActivityUpdateManyWithoutLeadNestedInput
  }

  export type LeadUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: ActivityUncheckedUpdateManyWithoutLeadNestedInput
  }

  export type LeadUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneWithoutActivitiesNestedInput
    lead?: LeadUpdateOneWithoutActivitiesNestedInput
  }

  export type ActivityUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    leadId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    leadId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestedEventUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestedEventUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestedEventUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IngestionQueueJobUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IngestionQueueJobUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IngestionQueueJobUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventKey?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payloadJson?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attemptCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deadLetteredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ModuleConfigCreateManyWebsiteConfigInput = {
    id: string
    tenantId: string
    moduleKey: string
    enabled?: boolean
    sortOrder?: number
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ModuleConfigUpdateWithoutWebsiteConfigInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModuleConfigUncheckedUpdateWithoutWebsiteConfigInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModuleConfigUncheckedUpdateManyWithoutWebsiteConfigInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    moduleKey?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeadCreateManyContactInput = {
    id: string
    tenantId: string
    status: string
    leadType: string
    source: string
    timeframe?: string | null
    notes?: string | null
    listingId?: string | null
    listingUrl?: string | null
    listingAddress?: string | null
    propertyType?: string | null
    beds?: number | null
    baths?: number | null
    sqft?: number | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ActivityCreateManyContactInput = {
    id: string
    tenantId: string
    leadId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type LeadUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutLeadsNestedInput
    activities?: ActivityUpdateManyWithoutLeadNestedInput
  }

  export type LeadUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: ActivityUncheckedUpdateManyWithoutLeadNestedInput
  }

  export type LeadUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    leadType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    timeframe?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingAddress?: NullableStringFieldUpdateOperationsInput | string | null
    propertyType?: NullableStringFieldUpdateOperationsInput | string | null
    beds?: NullableIntFieldUpdateOperationsInput | number | null
    baths?: NullableIntFieldUpdateOperationsInput | number | null
    sqft?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutActivitiesNestedInput
    lead?: LeadUpdateOneWithoutActivitiesNestedInput
  }

  export type ActivityUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    leadId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    leadId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityCreateManyLeadInput = {
    id: string
    tenantId: string
    contactId?: string | null
    activityType: string
    occurredAt: Date | string
    summary: string
    metadataJson?: string | null
    createdAt: Date | string
  }

  export type ActivityUpdateWithoutLeadInput = {
    id?: StringFieldUpdateOperationsInput | string
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: TenantUpdateOneRequiredWithoutActivitiesNestedInput
    contact?: ContactUpdateOneWithoutActivitiesNestedInput
  }

  export type ActivityUncheckedUpdateWithoutLeadInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityUncheckedUpdateManyWithoutLeadInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    contactId?: NullableStringFieldUpdateOperationsInput | string | null
    activityType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    summary?: StringFieldUpdateOperationsInput | string
    metadataJson?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}