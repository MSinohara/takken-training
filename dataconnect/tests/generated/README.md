# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListTrainings*](#listtrainings)
  - [*SearchMemberCompanies*](#searchmembercompanies)
  - [*GetPersonForCheckin*](#getpersonforcheckin)
  - [*RecentCheckins*](#recentcheckins)
  - [*SearchUncheckedTargets*](#searchuncheckedtargets)
  - [*GetCheckin*](#getcheckin)
- [**Mutations**](#mutations)
  - [*RegisterPersonalCheckin*](#registerpersonalcheckin)
  - [*RegisterCompanyCheckin*](#registercompanycheckin)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@takken-training/sql-dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@takken-training/sql-dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@takken-training/sql-dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListTrainings
You can execute the `ListTrainings` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
listTrainings(vars?: ListTrainingsVariables, options?: ExecuteQueryOptions): QueryPromise<ListTrainingsData, ListTrainingsVariables>;

interface ListTrainingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListTrainingsVariables): QueryRef<ListTrainingsData, ListTrainingsVariables>;
}
export const listTrainingsRef: ListTrainingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTrainings(dc: DataConnect, vars?: ListTrainingsVariables, options?: ExecuteQueryOptions): QueryPromise<ListTrainingsData, ListTrainingsVariables>;

interface ListTrainingsRef {
  ...
  (dc: DataConnect, vars?: ListTrainingsVariables): QueryRef<ListTrainingsData, ListTrainingsVariables>;
}
export const listTrainingsRef: ListTrainingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTrainingsRef:
```typescript
const name = listTrainingsRef.operationName;
console.log(name);
```

### Variables
The `ListTrainings` query has an optional argument of type `ListTrainingsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListTrainingsVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListTrainings` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTrainingsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTrainingsData {
  trainings: ({
    trainingId: string;
    title: string;
    eventDate: DateString;
    hostType?: string | null;
    receptionType?: string | null;
    attendanceUnit?: string | null;
    checkinTargetMode?: string | null;
    eventType?: string | null;
    venueId?: string | null;
    targetBlock?: string | null;
    targetBranch?: string | null;
    targetDistrict?: string | null;
    targetOrgIdsNew?: string | null;
    senderOrganizationId?: string | null;
    certificateEnabled?: boolean | null;
    active?: boolean | null;
    locationCheckEnabled?: boolean | null;
    locationCheckinStart?: string | null;
    locationCheckinEnd?: string | null;
    attendanceConfirmEnabled?: boolean | null;
    attendanceStatusPublic?: boolean | null;
    subject?: string | null;
    body?: string | null;
  } & Training_Key)[];
}
```
### Using `ListTrainings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTrainings, ListTrainingsVariables } from '@takken-training/sql-dataconnect';

// The `ListTrainings` query has an optional argument of type `ListTrainingsVariables`:
const listTrainingsVars: ListTrainingsVariables = {
  limit: ..., // optional
};

// Call the `listTrainings()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTrainings(listTrainingsVars);
// Variables can be defined inline as well.
const { data } = await listTrainings({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListTrainingsVariables` argument.
const { data } = await listTrainings();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTrainings(dataConnect, listTrainingsVars);

console.log(data.trainings);

// Or, you can use the `Promise` API.
listTrainings(listTrainingsVars).then((response) => {
  const data = response.data;
  console.log(data.trainings);
});
```

### Using `ListTrainings`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTrainingsRef, ListTrainingsVariables } from '@takken-training/sql-dataconnect';

// The `ListTrainings` query has an optional argument of type `ListTrainingsVariables`:
const listTrainingsVars: ListTrainingsVariables = {
  limit: ..., // optional
};

// Call the `listTrainingsRef()` function to get a reference to the query.
const ref = listTrainingsRef(listTrainingsVars);
// Variables can be defined inline as well.
const ref = listTrainingsRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListTrainingsVariables` argument.
const ref = listTrainingsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTrainingsRef(dataConnect, listTrainingsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.trainings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.trainings);
});
```

## SearchMemberCompanies
You can execute the `SearchMemberCompanies` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchMemberCompanies(vars?: SearchMemberCompaniesVariables, options?: ExecuteQueryOptions): QueryPromise<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;

interface SearchMemberCompaniesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SearchMemberCompaniesVariables): QueryRef<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;
}
export const searchMemberCompaniesRef: SearchMemberCompaniesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchMemberCompanies(dc: DataConnect, vars?: SearchMemberCompaniesVariables, options?: ExecuteQueryOptions): QueryPromise<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;

interface SearchMemberCompaniesRef {
  ...
  (dc: DataConnect, vars?: SearchMemberCompaniesVariables): QueryRef<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;
}
export const searchMemberCompaniesRef: SearchMemberCompaniesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchMemberCompaniesRef:
```typescript
const name = searchMemberCompaniesRef.operationName;
console.log(name);
```

### Variables
The `SearchMemberCompanies` query has an optional argument of type `SearchMemberCompaniesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchMemberCompaniesVariables {
  memberNo?: string | null;
  companyName?: string | null;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `SearchMemberCompanies` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchMemberCompaniesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchMemberCompaniesData {
  memberCompanies: ({
    memberNo: string;
    companyName: string;
    branch: string;
    district?: string | null;
    block: string;
    email?: string | null;
    people_on_company: ({
      personalId: string;
      name: string;
      email?: string | null;
    } & Person_Key)[];
  } & MemberCompany_Key)[];
}
```
### Using `SearchMemberCompanies`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchMemberCompanies, SearchMemberCompaniesVariables } from '@takken-training/sql-dataconnect';

// The `SearchMemberCompanies` query has an optional argument of type `SearchMemberCompaniesVariables`:
const searchMemberCompaniesVars: SearchMemberCompaniesVariables = {
  memberNo: ..., // optional
  companyName: ..., // optional
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchMemberCompanies()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchMemberCompanies(searchMemberCompaniesVars);
// Variables can be defined inline as well.
const { data } = await searchMemberCompanies({ memberNo: ..., companyName: ..., branch: ..., district: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `SearchMemberCompaniesVariables` argument.
const { data } = await searchMemberCompanies();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchMemberCompanies(dataConnect, searchMemberCompaniesVars);

console.log(data.memberCompanies);

// Or, you can use the `Promise` API.
searchMemberCompanies(searchMemberCompaniesVars).then((response) => {
  const data = response.data;
  console.log(data.memberCompanies);
});
```

### Using `SearchMemberCompanies`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchMemberCompaniesRef, SearchMemberCompaniesVariables } from '@takken-training/sql-dataconnect';

// The `SearchMemberCompanies` query has an optional argument of type `SearchMemberCompaniesVariables`:
const searchMemberCompaniesVars: SearchMemberCompaniesVariables = {
  memberNo: ..., // optional
  companyName: ..., // optional
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchMemberCompaniesRef()` function to get a reference to the query.
const ref = searchMemberCompaniesRef(searchMemberCompaniesVars);
// Variables can be defined inline as well.
const ref = searchMemberCompaniesRef({ memberNo: ..., companyName: ..., branch: ..., district: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `SearchMemberCompaniesVariables` argument.
const ref = searchMemberCompaniesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchMemberCompaniesRef(dataConnect, searchMemberCompaniesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.memberCompanies);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.memberCompanies);
});
```

## GetPersonForCheckin
You can execute the `GetPersonForCheckin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
getPersonForCheckin(vars: GetPersonForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetPersonForCheckinData, GetPersonForCheckinVariables>;

interface GetPersonForCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPersonForCheckinVariables): QueryRef<GetPersonForCheckinData, GetPersonForCheckinVariables>;
}
export const getPersonForCheckinRef: GetPersonForCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPersonForCheckin(dc: DataConnect, vars: GetPersonForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetPersonForCheckinData, GetPersonForCheckinVariables>;

interface GetPersonForCheckinRef {
  ...
  (dc: DataConnect, vars: GetPersonForCheckinVariables): QueryRef<GetPersonForCheckinData, GetPersonForCheckinVariables>;
}
export const getPersonForCheckinRef: GetPersonForCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPersonForCheckinRef:
```typescript
const name = getPersonForCheckinRef.operationName;
console.log(name);
```

### Variables
The `GetPersonForCheckin` query requires an argument of type `GetPersonForCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPersonForCheckinVariables {
  personalId: string;
}
```
### Return Type
Recall that executing the `GetPersonForCheckin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPersonForCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPersonForCheckinData {
  person?: {
    personalId: string;
    name: string;
    email?: string | null;
    company: {
      memberNo: string;
      companyName: string;
      branch: string;
      district?: string | null;
      block: string;
    } & MemberCompany_Key;
  } & Person_Key;
}
```
### Using `GetPersonForCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPersonForCheckin, GetPersonForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetPersonForCheckin` query requires an argument of type `GetPersonForCheckinVariables`:
const getPersonForCheckinVars: GetPersonForCheckinVariables = {
  personalId: ..., 
};

// Call the `getPersonForCheckin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPersonForCheckin(getPersonForCheckinVars);
// Variables can be defined inline as well.
const { data } = await getPersonForCheckin({ personalId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPersonForCheckin(dataConnect, getPersonForCheckinVars);

console.log(data.person);

// Or, you can use the `Promise` API.
getPersonForCheckin(getPersonForCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.person);
});
```

### Using `GetPersonForCheckin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPersonForCheckinRef, GetPersonForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetPersonForCheckin` query requires an argument of type `GetPersonForCheckinVariables`:
const getPersonForCheckinVars: GetPersonForCheckinVariables = {
  personalId: ..., 
};

// Call the `getPersonForCheckinRef()` function to get a reference to the query.
const ref = getPersonForCheckinRef(getPersonForCheckinVars);
// Variables can be defined inline as well.
const ref = getPersonForCheckinRef({ personalId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPersonForCheckinRef(dataConnect, getPersonForCheckinVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.person);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.person);
});
```

## RecentCheckins
You can execute the `RecentCheckins` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
recentCheckins(vars: RecentCheckinsVariables, options?: ExecuteQueryOptions): QueryPromise<RecentCheckinsData, RecentCheckinsVariables>;

interface RecentCheckinsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecentCheckinsVariables): QueryRef<RecentCheckinsData, RecentCheckinsVariables>;
}
export const recentCheckinsRef: RecentCheckinsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
recentCheckins(dc: DataConnect, vars: RecentCheckinsVariables, options?: ExecuteQueryOptions): QueryPromise<RecentCheckinsData, RecentCheckinsVariables>;

interface RecentCheckinsRef {
  ...
  (dc: DataConnect, vars: RecentCheckinsVariables): QueryRef<RecentCheckinsData, RecentCheckinsVariables>;
}
export const recentCheckinsRef: RecentCheckinsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the recentCheckinsRef:
```typescript
const name = recentCheckinsRef.operationName;
console.log(name);
```

### Variables
The `RecentCheckins` query requires an argument of type `RecentCheckinsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RecentCheckinsVariables {
  trainingId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `RecentCheckins` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RecentCheckinsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RecentCheckinsData {
  checkins: ({
    checkinId: string;
    checkedInAt: TimestampString;
    checkinMethod: string;
    attendanceUnit: string;
    company: {
      memberNo: string;
      companyName: string;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
    } & Person_Key;
  } & Checkin_Key)[];
}
```
### Using `RecentCheckins`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, recentCheckins, RecentCheckinsVariables } from '@takken-training/sql-dataconnect';

// The `RecentCheckins` query requires an argument of type `RecentCheckinsVariables`:
const recentCheckinsVars: RecentCheckinsVariables = {
  trainingId: ..., 
  limit: ..., // optional
};

// Call the `recentCheckins()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await recentCheckins(recentCheckinsVars);
// Variables can be defined inline as well.
const { data } = await recentCheckins({ trainingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await recentCheckins(dataConnect, recentCheckinsVars);

console.log(data.checkins);

// Or, you can use the `Promise` API.
recentCheckins(recentCheckinsVars).then((response) => {
  const data = response.data;
  console.log(data.checkins);
});
```

### Using `RecentCheckins`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, recentCheckinsRef, RecentCheckinsVariables } from '@takken-training/sql-dataconnect';

// The `RecentCheckins` query requires an argument of type `RecentCheckinsVariables`:
const recentCheckinsVars: RecentCheckinsVariables = {
  trainingId: ..., 
  limit: ..., // optional
};

// Call the `recentCheckinsRef()` function to get a reference to the query.
const ref = recentCheckinsRef(recentCheckinsVars);
// Variables can be defined inline as well.
const ref = recentCheckinsRef({ trainingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = recentCheckinsRef(dataConnect, recentCheckinsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.checkins);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.checkins);
});
```

## SearchUncheckedTargets
You can execute the `SearchUncheckedTargets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchUncheckedTargets(vars: SearchUncheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;

interface SearchUncheckedTargetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchUncheckedTargetsVariables): QueryRef<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;
}
export const searchUncheckedTargetsRef: SearchUncheckedTargetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchUncheckedTargets(dc: DataConnect, vars: SearchUncheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;

interface SearchUncheckedTargetsRef {
  ...
  (dc: DataConnect, vars: SearchUncheckedTargetsVariables): QueryRef<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;
}
export const searchUncheckedTargetsRef: SearchUncheckedTargetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchUncheckedTargetsRef:
```typescript
const name = searchUncheckedTargetsRef.operationName;
console.log(name);
```

### Variables
The `SearchUncheckedTargets` query requires an argument of type `SearchUncheckedTargetsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchUncheckedTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `SearchUncheckedTargets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchUncheckedTargetsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchUncheckedTargetsData {
  trainingTargets: ({
    targetId: string;
    branch: string;
    district?: string | null;
    company: {
      memberNo: string;
      companyName: string;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
      email?: string | null;
    } & Person_Key;
  })[];
}
```
### Using `SearchUncheckedTargets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchUncheckedTargets, SearchUncheckedTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchUncheckedTargets` query requires an argument of type `SearchUncheckedTargetsVariables`:
const searchUncheckedTargetsVars: SearchUncheckedTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchUncheckedTargets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchUncheckedTargets(searchUncheckedTargetsVars);
// Variables can be defined inline as well.
const { data } = await searchUncheckedTargets({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchUncheckedTargets(dataConnect, searchUncheckedTargetsVars);

console.log(data.trainingTargets);

// Or, you can use the `Promise` API.
searchUncheckedTargets(searchUncheckedTargetsVars).then((response) => {
  const data = response.data;
  console.log(data.trainingTargets);
});
```

### Using `SearchUncheckedTargets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchUncheckedTargetsRef, SearchUncheckedTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchUncheckedTargets` query requires an argument of type `SearchUncheckedTargetsVariables`:
const searchUncheckedTargetsVars: SearchUncheckedTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchUncheckedTargetsRef()` function to get a reference to the query.
const ref = searchUncheckedTargetsRef(searchUncheckedTargetsVars);
// Variables can be defined inline as well.
const ref = searchUncheckedTargetsRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchUncheckedTargetsRef(dataConnect, searchUncheckedTargetsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.trainingTargets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.trainingTargets);
});
```

## GetCheckin
You can execute the `GetCheckin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
getCheckin(vars: GetCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetCheckinData, GetCheckinVariables>;

interface GetCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCheckinVariables): QueryRef<GetCheckinData, GetCheckinVariables>;
}
export const getCheckinRef: GetCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCheckin(dc: DataConnect, vars: GetCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetCheckinData, GetCheckinVariables>;

interface GetCheckinRef {
  ...
  (dc: DataConnect, vars: GetCheckinVariables): QueryRef<GetCheckinData, GetCheckinVariables>;
}
export const getCheckinRef: GetCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCheckinRef:
```typescript
const name = getCheckinRef.operationName;
console.log(name);
```

### Variables
The `GetCheckin` query requires an argument of type `GetCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCheckinVariables {
  checkinId: string;
}
```
### Return Type
Recall that executing the `GetCheckin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCheckinData {
  checkin?: {
    checkinId: string;
    trainingId: string;
    attendanceUnit: string;
    targetId: string;
    checkedInAt: TimestampString;
  } & Checkin_Key;
}
```
### Using `GetCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCheckin, GetCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetCheckin` query requires an argument of type `GetCheckinVariables`:
const getCheckinVars: GetCheckinVariables = {
  checkinId: ..., 
};

// Call the `getCheckin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCheckin(getCheckinVars);
// Variables can be defined inline as well.
const { data } = await getCheckin({ checkinId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCheckin(dataConnect, getCheckinVars);

console.log(data.checkin);

// Or, you can use the `Promise` API.
getCheckin(getCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.checkin);
});
```

### Using `GetCheckin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCheckinRef, GetCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetCheckin` query requires an argument of type `GetCheckinVariables`:
const getCheckinVars: GetCheckinVariables = {
  checkinId: ..., 
};

// Call the `getCheckinRef()` function to get a reference to the query.
const ref = getCheckinRef(getCheckinVars);
// Variables can be defined inline as well.
const ref = getCheckinRef({ checkinId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCheckinRef(dataConnect, getCheckinVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.checkin);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.checkin);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## RegisterPersonalCheckin
You can execute the `RegisterPersonalCheckin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
registerPersonalCheckin(vars: RegisterPersonalCheckinVariables): MutationPromise<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;

interface RegisterPersonalCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterPersonalCheckinVariables): MutationRef<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;
}
export const registerPersonalCheckinRef: RegisterPersonalCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerPersonalCheckin(dc: DataConnect, vars: RegisterPersonalCheckinVariables): MutationPromise<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;

interface RegisterPersonalCheckinRef {
  ...
  (dc: DataConnect, vars: RegisterPersonalCheckinVariables): MutationRef<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;
}
export const registerPersonalCheckinRef: RegisterPersonalCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerPersonalCheckinRef:
```typescript
const name = registerPersonalCheckinRef.operationName;
console.log(name);
```

### Variables
The `RegisterPersonalCheckin` mutation requires an argument of type `RegisterPersonalCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterPersonalCheckinVariables {
  checkinId: string;
  trainingId: string;
  memberNo: string;
  personalId: string;
  checkinMethod: string;
}
```
### Return Type
Recall that executing the `RegisterPersonalCheckin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterPersonalCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterPersonalCheckinData {
  checkin_insert: Checkin_Key;
}
```
### Using `RegisterPersonalCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerPersonalCheckin, RegisterPersonalCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterPersonalCheckin` mutation requires an argument of type `RegisterPersonalCheckinVariables`:
const registerPersonalCheckinVars: RegisterPersonalCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  memberNo: ..., 
  personalId: ..., 
  checkinMethod: ..., 
};

// Call the `registerPersonalCheckin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerPersonalCheckin(registerPersonalCheckinVars);
// Variables can be defined inline as well.
const { data } = await registerPersonalCheckin({ checkinId: ..., trainingId: ..., memberNo: ..., personalId: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerPersonalCheckin(dataConnect, registerPersonalCheckinVars);

console.log(data.checkin_insert);

// Or, you can use the `Promise` API.
registerPersonalCheckin(registerPersonalCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.checkin_insert);
});
```

### Using `RegisterPersonalCheckin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerPersonalCheckinRef, RegisterPersonalCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterPersonalCheckin` mutation requires an argument of type `RegisterPersonalCheckinVariables`:
const registerPersonalCheckinVars: RegisterPersonalCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  memberNo: ..., 
  personalId: ..., 
  checkinMethod: ..., 
};

// Call the `registerPersonalCheckinRef()` function to get a reference to the mutation.
const ref = registerPersonalCheckinRef(registerPersonalCheckinVars);
// Variables can be defined inline as well.
const ref = registerPersonalCheckinRef({ checkinId: ..., trainingId: ..., memberNo: ..., personalId: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerPersonalCheckinRef(dataConnect, registerPersonalCheckinVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.checkin_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.checkin_insert);
});
```

## RegisterCompanyCheckin
You can execute the `RegisterCompanyCheckin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
registerCompanyCheckin(vars: RegisterCompanyCheckinVariables): MutationPromise<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;

interface RegisterCompanyCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterCompanyCheckinVariables): MutationRef<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;
}
export const registerCompanyCheckinRef: RegisterCompanyCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerCompanyCheckin(dc: DataConnect, vars: RegisterCompanyCheckinVariables): MutationPromise<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;

interface RegisterCompanyCheckinRef {
  ...
  (dc: DataConnect, vars: RegisterCompanyCheckinVariables): MutationRef<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;
}
export const registerCompanyCheckinRef: RegisterCompanyCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerCompanyCheckinRef:
```typescript
const name = registerCompanyCheckinRef.operationName;
console.log(name);
```

### Variables
The `RegisterCompanyCheckin` mutation requires an argument of type `RegisterCompanyCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterCompanyCheckinVariables {
  checkinId: string;
  trainingId: string;
  memberNo: string;
  checkinMethod: string;
}
```
### Return Type
Recall that executing the `RegisterCompanyCheckin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterCompanyCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterCompanyCheckinData {
  checkin_insert: Checkin_Key;
}
```
### Using `RegisterCompanyCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerCompanyCheckin, RegisterCompanyCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterCompanyCheckin` mutation requires an argument of type `RegisterCompanyCheckinVariables`:
const registerCompanyCheckinVars: RegisterCompanyCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  memberNo: ..., 
  checkinMethod: ..., 
};

// Call the `registerCompanyCheckin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerCompanyCheckin(registerCompanyCheckinVars);
// Variables can be defined inline as well.
const { data } = await registerCompanyCheckin({ checkinId: ..., trainingId: ..., memberNo: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerCompanyCheckin(dataConnect, registerCompanyCheckinVars);

console.log(data.checkin_insert);

// Or, you can use the `Promise` API.
registerCompanyCheckin(registerCompanyCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.checkin_insert);
});
```

### Using `RegisterCompanyCheckin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerCompanyCheckinRef, RegisterCompanyCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterCompanyCheckin` mutation requires an argument of type `RegisterCompanyCheckinVariables`:
const registerCompanyCheckinVars: RegisterCompanyCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  memberNo: ..., 
  checkinMethod: ..., 
};

// Call the `registerCompanyCheckinRef()` function to get a reference to the mutation.
const ref = registerCompanyCheckinRef(registerCompanyCheckinVars);
// Variables can be defined inline as well.
const ref = registerCompanyCheckinRef({ checkinId: ..., trainingId: ..., memberNo: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerCompanyCheckinRef(dataConnect, registerCompanyCheckinVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.checkin_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.checkin_insert);
});
```

