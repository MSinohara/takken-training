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
  - [*SearchPeopleForCheckin*](#searchpeopleforcheckin)
  - [*GetTrainingTargetForCheckin*](#gettrainingtargetforcheckin)
  - [*RecentGuestCheckins*](#recentguestcheckins)
  - [*GuestCheckinSummary*](#guestcheckinsummary)
  - [*RecentCheckins*](#recentcheckins)
  - [*TrainingCheckinSummary*](#trainingcheckinsummary)
  - [*SearchTrainingTargets*](#searchtrainingtargets)
  - [*SearchCheckedTargets*](#searchcheckedtargets)
  - [*SearchCheckedCompanyTargets*](#searchcheckedcompanytargets)
  - [*TrainingCheckinsByBranchDistrict*](#trainingcheckinsbybranchdistrict)
  - [*SearchUncheckedTargets*](#searchuncheckedtargets)
  - [*SearchUncheckedCompanyTargets*](#searchuncheckedcompanytargets)
  - [*GetCheckin*](#getcheckin)
  - [*ListCheckinHistory*](#listcheckinhistory)
  - [*GetPlannedAttendee*](#getplannedattendee)
  - [*GetPlannedAttendeeForCheckin*](#getplannedattendeeforcheckin)
  - [*ListPlannedAttendees*](#listplannedattendees)
  - [*PlannedAttendeeSummary*](#plannedattendeesummary)
  - [*ListCheckedPlannedPersonal*](#listcheckedplannedpersonal)
  - [*ListCheckedPlannedCompany*](#listcheckedplannedcompany)
- [**Mutations**](#mutations)
  - [*RegisterPersonalCheckin*](#registerpersonalcheckin)
  - [*RegisterNewPersonalCheckin*](#registernewpersonalcheckin)
  - [*RegisterCompanyCheckin*](#registercompanycheckin)
  - [*RegisterGuestCheckin*](#registerguestcheckin)
  - [*CancelCheckin*](#cancelcheckin)
  - [*RestoreCheckin*](#restorecheckin)
  - [*RestoreCancelledCheckinPublic*](#restorecancelledcheckinpublic)
  - [*AddPlannedAttendee*](#addplannedattendee)
  - [*RemovePlannedAttendee*](#removeplannedattendee)

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
  memberNo?: string;
  companyName?: string;
  branch?: string;
  district?: string;
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

## SearchPeopleForCheckin
You can execute the `SearchPeopleForCheckin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchPeopleForCheckin(vars?: SearchPeopleForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<SearchPeopleForCheckinData, SearchPeopleForCheckinVariables>;

interface SearchPeopleForCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SearchPeopleForCheckinVariables): QueryRef<SearchPeopleForCheckinData, SearchPeopleForCheckinVariables>;
}
export const searchPeopleForCheckinRef: SearchPeopleForCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchPeopleForCheckin(dc: DataConnect, vars?: SearchPeopleForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<SearchPeopleForCheckinData, SearchPeopleForCheckinVariables>;

interface SearchPeopleForCheckinRef {
  ...
  (dc: DataConnect, vars?: SearchPeopleForCheckinVariables): QueryRef<SearchPeopleForCheckinData, SearchPeopleForCheckinVariables>;
}
export const searchPeopleForCheckinRef: SearchPeopleForCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchPeopleForCheckinRef:
```typescript
const name = searchPeopleForCheckinRef.operationName;
console.log(name);
```

### Variables
The `SearchPeopleForCheckin` query has an optional argument of type `SearchPeopleForCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchPeopleForCheckinVariables {
  name?: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `SearchPeopleForCheckin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchPeopleForCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchPeopleForCheckinData {
  people: ({
    personalId: string;
    name: string;
    email?: string | null;
    company: {
      memberNo: string;
      companyName: string;
      branch: string;
      district?: string | null;
      block: string;
      email?: string | null;
    } & MemberCompany_Key;
  } & Person_Key)[];
}
```
### Using `SearchPeopleForCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchPeopleForCheckin, SearchPeopleForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `SearchPeopleForCheckin` query has an optional argument of type `SearchPeopleForCheckinVariables`:
const searchPeopleForCheckinVars: SearchPeopleForCheckinVariables = {
  name: ..., // optional
  limit: ..., // optional
};

// Call the `searchPeopleForCheckin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchPeopleForCheckin(searchPeopleForCheckinVars);
// Variables can be defined inline as well.
const { data } = await searchPeopleForCheckin({ name: ..., limit: ..., });
// Since all variables are optional for this query, you can omit the `SearchPeopleForCheckinVariables` argument.
const { data } = await searchPeopleForCheckin();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchPeopleForCheckin(dataConnect, searchPeopleForCheckinVars);

console.log(data.people);

// Or, you can use the `Promise` API.
searchPeopleForCheckin(searchPeopleForCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.people);
});
```

### Using `SearchPeopleForCheckin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchPeopleForCheckinRef, SearchPeopleForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `SearchPeopleForCheckin` query has an optional argument of type `SearchPeopleForCheckinVariables`:
const searchPeopleForCheckinVars: SearchPeopleForCheckinVariables = {
  name: ..., // optional
  limit: ..., // optional
};

// Call the `searchPeopleForCheckinRef()` function to get a reference to the query.
const ref = searchPeopleForCheckinRef(searchPeopleForCheckinVars);
// Variables can be defined inline as well.
const ref = searchPeopleForCheckinRef({ name: ..., limit: ..., });
// Since all variables are optional for this query, you can omit the `SearchPeopleForCheckinVariables` argument.
const ref = searchPeopleForCheckinRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchPeopleForCheckinRef(dataConnect, searchPeopleForCheckinVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.people);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.people);
});
```

## GetTrainingTargetForCheckin
You can execute the `GetTrainingTargetForCheckin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
getTrainingTargetForCheckin(vars: GetTrainingTargetForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;

interface GetTrainingTargetForCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTrainingTargetForCheckinVariables): QueryRef<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;
}
export const getTrainingTargetForCheckinRef: GetTrainingTargetForCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTrainingTargetForCheckin(dc: DataConnect, vars: GetTrainingTargetForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;

interface GetTrainingTargetForCheckinRef {
  ...
  (dc: DataConnect, vars: GetTrainingTargetForCheckinVariables): QueryRef<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;
}
export const getTrainingTargetForCheckinRef: GetTrainingTargetForCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTrainingTargetForCheckinRef:
```typescript
const name = getTrainingTargetForCheckinRef.operationName;
console.log(name);
```

### Variables
The `GetTrainingTargetForCheckin` query requires an argument of type `GetTrainingTargetForCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTrainingTargetForCheckinVariables {
  trainingId: string;
  targetType: string;
  targetId: string;
}
```
### Return Type
Recall that executing the `GetTrainingTargetForCheckin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTrainingTargetForCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTrainingTargetForCheckinData {
  trainingTarget?: {
    targetType: string;
    targetId: string;
    memberNo: string;
    personalId?: string | null;
    branch: string;
    district?: string | null;
    block: string;
  };
}
```
### Using `GetTrainingTargetForCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTrainingTargetForCheckin, GetTrainingTargetForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetTrainingTargetForCheckin` query requires an argument of type `GetTrainingTargetForCheckinVariables`:
const getTrainingTargetForCheckinVars: GetTrainingTargetForCheckinVariables = {
  trainingId: ..., 
  targetType: ..., 
  targetId: ..., 
};

// Call the `getTrainingTargetForCheckin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTrainingTargetForCheckin(getTrainingTargetForCheckinVars);
// Variables can be defined inline as well.
const { data } = await getTrainingTargetForCheckin({ trainingId: ..., targetType: ..., targetId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTrainingTargetForCheckin(dataConnect, getTrainingTargetForCheckinVars);

console.log(data.trainingTarget);

// Or, you can use the `Promise` API.
getTrainingTargetForCheckin(getTrainingTargetForCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.trainingTarget);
});
```

### Using `GetTrainingTargetForCheckin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTrainingTargetForCheckinRef, GetTrainingTargetForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetTrainingTargetForCheckin` query requires an argument of type `GetTrainingTargetForCheckinVariables`:
const getTrainingTargetForCheckinVars: GetTrainingTargetForCheckinVariables = {
  trainingId: ..., 
  targetType: ..., 
  targetId: ..., 
};

// Call the `getTrainingTargetForCheckinRef()` function to get a reference to the query.
const ref = getTrainingTargetForCheckinRef(getTrainingTargetForCheckinVars);
// Variables can be defined inline as well.
const ref = getTrainingTargetForCheckinRef({ trainingId: ..., targetType: ..., targetId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTrainingTargetForCheckinRef(dataConnect, getTrainingTargetForCheckinVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.trainingTarget);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.trainingTarget);
});
```

## RecentGuestCheckins
You can execute the `RecentGuestCheckins` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
recentGuestCheckins(vars: RecentGuestCheckinsVariables, options?: ExecuteQueryOptions): QueryPromise<RecentGuestCheckinsData, RecentGuestCheckinsVariables>;

interface RecentGuestCheckinsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecentGuestCheckinsVariables): QueryRef<RecentGuestCheckinsData, RecentGuestCheckinsVariables>;
}
export const recentGuestCheckinsRef: RecentGuestCheckinsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
recentGuestCheckins(dc: DataConnect, vars: RecentGuestCheckinsVariables, options?: ExecuteQueryOptions): QueryPromise<RecentGuestCheckinsData, RecentGuestCheckinsVariables>;

interface RecentGuestCheckinsRef {
  ...
  (dc: DataConnect, vars: RecentGuestCheckinsVariables): QueryRef<RecentGuestCheckinsData, RecentGuestCheckinsVariables>;
}
export const recentGuestCheckinsRef: RecentGuestCheckinsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the recentGuestCheckinsRef:
```typescript
const name = recentGuestCheckinsRef.operationName;
console.log(name);
```

### Variables
The `RecentGuestCheckins` query requires an argument of type `RecentGuestCheckinsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RecentGuestCheckinsVariables {
  trainingId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `RecentGuestCheckins` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RecentGuestCheckinsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RecentGuestCheckinsData {
  guestCheckins: ({
    checkinId: string;
    checkedInAt: TimestampString;
    checkinMethod: string;
    participantName: string;
    organizationName?: string | null;
    block?: string | null;
    branch?: string | null;
    receptionCategory: string;
  } & GuestCheckin_Key)[];
}
```
### Using `RecentGuestCheckins`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, recentGuestCheckins, RecentGuestCheckinsVariables } from '@takken-training/sql-dataconnect';

// The `RecentGuestCheckins` query requires an argument of type `RecentGuestCheckinsVariables`:
const recentGuestCheckinsVars: RecentGuestCheckinsVariables = {
  trainingId: ..., 
  limit: ..., // optional
};

// Call the `recentGuestCheckins()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await recentGuestCheckins(recentGuestCheckinsVars);
// Variables can be defined inline as well.
const { data } = await recentGuestCheckins({ trainingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await recentGuestCheckins(dataConnect, recentGuestCheckinsVars);

console.log(data.guestCheckins);

// Or, you can use the `Promise` API.
recentGuestCheckins(recentGuestCheckinsVars).then((response) => {
  const data = response.data;
  console.log(data.guestCheckins);
});
```

### Using `RecentGuestCheckins`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, recentGuestCheckinsRef, RecentGuestCheckinsVariables } from '@takken-training/sql-dataconnect';

// The `RecentGuestCheckins` query requires an argument of type `RecentGuestCheckinsVariables`:
const recentGuestCheckinsVars: RecentGuestCheckinsVariables = {
  trainingId: ..., 
  limit: ..., // optional
};

// Call the `recentGuestCheckinsRef()` function to get a reference to the query.
const ref = recentGuestCheckinsRef(recentGuestCheckinsVars);
// Variables can be defined inline as well.
const ref = recentGuestCheckinsRef({ trainingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = recentGuestCheckinsRef(dataConnect, recentGuestCheckinsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.guestCheckins);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.guestCheckins);
});
```

## GuestCheckinSummary
You can execute the `GuestCheckinSummary` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
guestCheckinSummary(vars: GuestCheckinSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<GuestCheckinSummaryData, GuestCheckinSummaryVariables>;

interface GuestCheckinSummaryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GuestCheckinSummaryVariables): QueryRef<GuestCheckinSummaryData, GuestCheckinSummaryVariables>;
}
export const guestCheckinSummaryRef: GuestCheckinSummaryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
guestCheckinSummary(dc: DataConnect, vars: GuestCheckinSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<GuestCheckinSummaryData, GuestCheckinSummaryVariables>;

interface GuestCheckinSummaryRef {
  ...
  (dc: DataConnect, vars: GuestCheckinSummaryVariables): QueryRef<GuestCheckinSummaryData, GuestCheckinSummaryVariables>;
}
export const guestCheckinSummaryRef: GuestCheckinSummaryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the guestCheckinSummaryRef:
```typescript
const name = guestCheckinSummaryRef.operationName;
console.log(name);
```

### Variables
The `GuestCheckinSummary` query requires an argument of type `GuestCheckinSummaryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GuestCheckinSummaryVariables {
  trainingId: string;
}
```
### Return Type
Recall that executing the `GuestCheckinSummary` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GuestCheckinSummaryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GuestCheckinSummaryData {
  guestCheckins: ({
    _count: number;
  })[];
}
```
### Using `GuestCheckinSummary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, guestCheckinSummary, GuestCheckinSummaryVariables } from '@takken-training/sql-dataconnect';

// The `GuestCheckinSummary` query requires an argument of type `GuestCheckinSummaryVariables`:
const guestCheckinSummaryVars: GuestCheckinSummaryVariables = {
  trainingId: ..., 
};

// Call the `guestCheckinSummary()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await guestCheckinSummary(guestCheckinSummaryVars);
// Variables can be defined inline as well.
const { data } = await guestCheckinSummary({ trainingId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await guestCheckinSummary(dataConnect, guestCheckinSummaryVars);

console.log(data.guestCheckins);

// Or, you can use the `Promise` API.
guestCheckinSummary(guestCheckinSummaryVars).then((response) => {
  const data = response.data;
  console.log(data.guestCheckins);
});
```

### Using `GuestCheckinSummary`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, guestCheckinSummaryRef, GuestCheckinSummaryVariables } from '@takken-training/sql-dataconnect';

// The `GuestCheckinSummary` query requires an argument of type `GuestCheckinSummaryVariables`:
const guestCheckinSummaryVars: GuestCheckinSummaryVariables = {
  trainingId: ..., 
};

// Call the `guestCheckinSummaryRef()` function to get a reference to the query.
const ref = guestCheckinSummaryRef(guestCheckinSummaryVars);
// Variables can be defined inline as well.
const ref = guestCheckinSummaryRef({ trainingId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = guestCheckinSummaryRef(dataConnect, guestCheckinSummaryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.guestCheckins);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.guestCheckins);
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

## TrainingCheckinSummary
You can execute the `TrainingCheckinSummary` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
trainingCheckinSummary(vars: TrainingCheckinSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;

interface TrainingCheckinSummaryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TrainingCheckinSummaryVariables): QueryRef<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;
}
export const trainingCheckinSummaryRef: TrainingCheckinSummaryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
trainingCheckinSummary(dc: DataConnect, vars: TrainingCheckinSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;

interface TrainingCheckinSummaryRef {
  ...
  (dc: DataConnect, vars: TrainingCheckinSummaryVariables): QueryRef<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;
}
export const trainingCheckinSummaryRef: TrainingCheckinSummaryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the trainingCheckinSummaryRef:
```typescript
const name = trainingCheckinSummaryRef.operationName;
console.log(name);
```

### Variables
The `TrainingCheckinSummary` query requires an argument of type `TrainingCheckinSummaryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TrainingCheckinSummaryVariables {
  trainingId: string;
  targetType: string;
  attendanceUnit: string;
}
```
### Return Type
Recall that executing the `TrainingCheckinSummary` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TrainingCheckinSummaryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TrainingCheckinSummaryData {
  targets: ({
    _count: number;
  })[];
  received: ({
    _count: number;
  })[];
  personalTargetReceived: ({
    _count: number;
  })[];
  companyTargetReceived: ({
    _count: number;
  })[];
}
```
### Using `TrainingCheckinSummary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, trainingCheckinSummary, TrainingCheckinSummaryVariables } from '@takken-training/sql-dataconnect';

// The `TrainingCheckinSummary` query requires an argument of type `TrainingCheckinSummaryVariables`:
const trainingCheckinSummaryVars: TrainingCheckinSummaryVariables = {
  trainingId: ..., 
  targetType: ..., 
  attendanceUnit: ..., 
};

// Call the `trainingCheckinSummary()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await trainingCheckinSummary(trainingCheckinSummaryVars);
// Variables can be defined inline as well.
const { data } = await trainingCheckinSummary({ trainingId: ..., targetType: ..., attendanceUnit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await trainingCheckinSummary(dataConnect, trainingCheckinSummaryVars);

console.log(data.targets);
console.log(data.received);
console.log(data.personalTargetReceived);
console.log(data.companyTargetReceived);

// Or, you can use the `Promise` API.
trainingCheckinSummary(trainingCheckinSummaryVars).then((response) => {
  const data = response.data;
  console.log(data.targets);
  console.log(data.received);
  console.log(data.personalTargetReceived);
  console.log(data.companyTargetReceived);
});
```

### Using `TrainingCheckinSummary`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, trainingCheckinSummaryRef, TrainingCheckinSummaryVariables } from '@takken-training/sql-dataconnect';

// The `TrainingCheckinSummary` query requires an argument of type `TrainingCheckinSummaryVariables`:
const trainingCheckinSummaryVars: TrainingCheckinSummaryVariables = {
  trainingId: ..., 
  targetType: ..., 
  attendanceUnit: ..., 
};

// Call the `trainingCheckinSummaryRef()` function to get a reference to the query.
const ref = trainingCheckinSummaryRef(trainingCheckinSummaryVars);
// Variables can be defined inline as well.
const ref = trainingCheckinSummaryRef({ trainingId: ..., targetType: ..., attendanceUnit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = trainingCheckinSummaryRef(dataConnect, trainingCheckinSummaryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.targets);
console.log(data.received);
console.log(data.personalTargetReceived);
console.log(data.companyTargetReceived);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.targets);
  console.log(data.received);
  console.log(data.personalTargetReceived);
  console.log(data.companyTargetReceived);
});
```

## SearchTrainingTargets
You can execute the `SearchTrainingTargets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchTrainingTargets(vars: SearchTrainingTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;

interface SearchTrainingTargetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchTrainingTargetsVariables): QueryRef<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;
}
export const searchTrainingTargetsRef: SearchTrainingTargetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchTrainingTargets(dc: DataConnect, vars: SearchTrainingTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;

interface SearchTrainingTargetsRef {
  ...
  (dc: DataConnect, vars: SearchTrainingTargetsVariables): QueryRef<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;
}
export const searchTrainingTargetsRef: SearchTrainingTargetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchTrainingTargetsRef:
```typescript
const name = searchTrainingTargetsRef.operationName;
console.log(name);
```

### Variables
The `SearchTrainingTargets` query requires an argument of type `SearchTrainingTargetsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchTrainingTargetsVariables {
  trainingId: string;
  targetType: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `SearchTrainingTargets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchTrainingTargetsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchTrainingTargetsData {
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
### Using `SearchTrainingTargets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchTrainingTargets, SearchTrainingTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchTrainingTargets` query requires an argument of type `SearchTrainingTargetsVariables`:
const searchTrainingTargetsVars: SearchTrainingTargetsVariables = {
  trainingId: ..., 
  targetType: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchTrainingTargets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchTrainingTargets(searchTrainingTargetsVars);
// Variables can be defined inline as well.
const { data } = await searchTrainingTargets({ trainingId: ..., targetType: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchTrainingTargets(dataConnect, searchTrainingTargetsVars);

console.log(data.trainingTargets);

// Or, you can use the `Promise` API.
searchTrainingTargets(searchTrainingTargetsVars).then((response) => {
  const data = response.data;
  console.log(data.trainingTargets);
});
```

### Using `SearchTrainingTargets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchTrainingTargetsRef, SearchTrainingTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchTrainingTargets` query requires an argument of type `SearchTrainingTargetsVariables`:
const searchTrainingTargetsVars: SearchTrainingTargetsVariables = {
  trainingId: ..., 
  targetType: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchTrainingTargetsRef()` function to get a reference to the query.
const ref = searchTrainingTargetsRef(searchTrainingTargetsVars);
// Variables can be defined inline as well.
const ref = searchTrainingTargetsRef({ trainingId: ..., targetType: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchTrainingTargetsRef(dataConnect, searchTrainingTargetsVars);

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

## SearchCheckedTargets
You can execute the `SearchCheckedTargets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchCheckedTargets(vars: SearchCheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;

interface SearchCheckedTargetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchCheckedTargetsVariables): QueryRef<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;
}
export const searchCheckedTargetsRef: SearchCheckedTargetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchCheckedTargets(dc: DataConnect, vars: SearchCheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;

interface SearchCheckedTargetsRef {
  ...
  (dc: DataConnect, vars: SearchCheckedTargetsVariables): QueryRef<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;
}
export const searchCheckedTargetsRef: SearchCheckedTargetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchCheckedTargetsRef:
```typescript
const name = searchCheckedTargetsRef.operationName;
console.log(name);
```

### Variables
The `SearchCheckedTargets` query requires an argument of type `SearchCheckedTargetsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchCheckedTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `SearchCheckedTargets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchCheckedTargetsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchCheckedTargetsData {
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
### Using `SearchCheckedTargets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchCheckedTargets, SearchCheckedTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchCheckedTargets` query requires an argument of type `SearchCheckedTargetsVariables`:
const searchCheckedTargetsVars: SearchCheckedTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchCheckedTargets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchCheckedTargets(searchCheckedTargetsVars);
// Variables can be defined inline as well.
const { data } = await searchCheckedTargets({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchCheckedTargets(dataConnect, searchCheckedTargetsVars);

console.log(data.trainingTargets);

// Or, you can use the `Promise` API.
searchCheckedTargets(searchCheckedTargetsVars).then((response) => {
  const data = response.data;
  console.log(data.trainingTargets);
});
```

### Using `SearchCheckedTargets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchCheckedTargetsRef, SearchCheckedTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchCheckedTargets` query requires an argument of type `SearchCheckedTargetsVariables`:
const searchCheckedTargetsVars: SearchCheckedTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchCheckedTargetsRef()` function to get a reference to the query.
const ref = searchCheckedTargetsRef(searchCheckedTargetsVars);
// Variables can be defined inline as well.
const ref = searchCheckedTargetsRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchCheckedTargetsRef(dataConnect, searchCheckedTargetsVars);

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

## SearchCheckedCompanyTargets
You can execute the `SearchCheckedCompanyTargets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchCheckedCompanyTargets(vars: SearchCheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;

interface SearchCheckedCompanyTargetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchCheckedCompanyTargetsVariables): QueryRef<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;
}
export const searchCheckedCompanyTargetsRef: SearchCheckedCompanyTargetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchCheckedCompanyTargets(dc: DataConnect, vars: SearchCheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;

interface SearchCheckedCompanyTargetsRef {
  ...
  (dc: DataConnect, vars: SearchCheckedCompanyTargetsVariables): QueryRef<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;
}
export const searchCheckedCompanyTargetsRef: SearchCheckedCompanyTargetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchCheckedCompanyTargetsRef:
```typescript
const name = searchCheckedCompanyTargetsRef.operationName;
console.log(name);
```

### Variables
The `SearchCheckedCompanyTargets` query requires an argument of type `SearchCheckedCompanyTargetsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchCheckedCompanyTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `SearchCheckedCompanyTargets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchCheckedCompanyTargetsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchCheckedCompanyTargetsData {
  trainingTargets: ({
    targetId: string;
    branch: string;
    district?: string | null;
    company: {
      memberNo: string;
      companyName: string;
      email?: string | null;
    } & MemberCompany_Key;
  })[];
}
```
### Using `SearchCheckedCompanyTargets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchCheckedCompanyTargets, SearchCheckedCompanyTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchCheckedCompanyTargets` query requires an argument of type `SearchCheckedCompanyTargetsVariables`:
const searchCheckedCompanyTargetsVars: SearchCheckedCompanyTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchCheckedCompanyTargets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchCheckedCompanyTargets(searchCheckedCompanyTargetsVars);
// Variables can be defined inline as well.
const { data } = await searchCheckedCompanyTargets({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchCheckedCompanyTargets(dataConnect, searchCheckedCompanyTargetsVars);

console.log(data.trainingTargets);

// Or, you can use the `Promise` API.
searchCheckedCompanyTargets(searchCheckedCompanyTargetsVars).then((response) => {
  const data = response.data;
  console.log(data.trainingTargets);
});
```

### Using `SearchCheckedCompanyTargets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchCheckedCompanyTargetsRef, SearchCheckedCompanyTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchCheckedCompanyTargets` query requires an argument of type `SearchCheckedCompanyTargetsVariables`:
const searchCheckedCompanyTargetsVars: SearchCheckedCompanyTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchCheckedCompanyTargetsRef()` function to get a reference to the query.
const ref = searchCheckedCompanyTargetsRef(searchCheckedCompanyTargetsVars);
// Variables can be defined inline as well.
const ref = searchCheckedCompanyTargetsRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchCheckedCompanyTargetsRef(dataConnect, searchCheckedCompanyTargetsVars);

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

## TrainingCheckinsByBranchDistrict
You can execute the `TrainingCheckinsByBranchDistrict` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
trainingCheckinsByBranchDistrict(vars: TrainingCheckinsByBranchDistrictVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;

interface TrainingCheckinsByBranchDistrictRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TrainingCheckinsByBranchDistrictVariables): QueryRef<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;
}
export const trainingCheckinsByBranchDistrictRef: TrainingCheckinsByBranchDistrictRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
trainingCheckinsByBranchDistrict(dc: DataConnect, vars: TrainingCheckinsByBranchDistrictVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;

interface TrainingCheckinsByBranchDistrictRef {
  ...
  (dc: DataConnect, vars: TrainingCheckinsByBranchDistrictVariables): QueryRef<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;
}
export const trainingCheckinsByBranchDistrictRef: TrainingCheckinsByBranchDistrictRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the trainingCheckinsByBranchDistrictRef:
```typescript
const name = trainingCheckinsByBranchDistrictRef.operationName;
console.log(name);
```

### Variables
The `TrainingCheckinsByBranchDistrict` query requires an argument of type `TrainingCheckinsByBranchDistrictVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TrainingCheckinsByBranchDistrictVariables {
  trainingId: string;
  attendanceUnit: string;
}
```
### Return Type
Recall that executing the `TrainingCheckinsByBranchDistrict` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TrainingCheckinsByBranchDistrictData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TrainingCheckinsByBranchDistrictData {
  checkins: ({
    company: {
      branch: string;
      district?: string | null;
    };
    _count: number;
  })[];
}
```
### Using `TrainingCheckinsByBranchDistrict`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, trainingCheckinsByBranchDistrict, TrainingCheckinsByBranchDistrictVariables } from '@takken-training/sql-dataconnect';

// The `TrainingCheckinsByBranchDistrict` query requires an argument of type `TrainingCheckinsByBranchDistrictVariables`:
const trainingCheckinsByBranchDistrictVars: TrainingCheckinsByBranchDistrictVariables = {
  trainingId: ..., 
  attendanceUnit: ..., 
};

// Call the `trainingCheckinsByBranchDistrict()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await trainingCheckinsByBranchDistrict(trainingCheckinsByBranchDistrictVars);
// Variables can be defined inline as well.
const { data } = await trainingCheckinsByBranchDistrict({ trainingId: ..., attendanceUnit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await trainingCheckinsByBranchDistrict(dataConnect, trainingCheckinsByBranchDistrictVars);

console.log(data.checkins);

// Or, you can use the `Promise` API.
trainingCheckinsByBranchDistrict(trainingCheckinsByBranchDistrictVars).then((response) => {
  const data = response.data;
  console.log(data.checkins);
});
```

### Using `TrainingCheckinsByBranchDistrict`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, trainingCheckinsByBranchDistrictRef, TrainingCheckinsByBranchDistrictVariables } from '@takken-training/sql-dataconnect';

// The `TrainingCheckinsByBranchDistrict` query requires an argument of type `TrainingCheckinsByBranchDistrictVariables`:
const trainingCheckinsByBranchDistrictVars: TrainingCheckinsByBranchDistrictVariables = {
  trainingId: ..., 
  attendanceUnit: ..., 
};

// Call the `trainingCheckinsByBranchDistrictRef()` function to get a reference to the query.
const ref = trainingCheckinsByBranchDistrictRef(trainingCheckinsByBranchDistrictVars);
// Variables can be defined inline as well.
const ref = trainingCheckinsByBranchDistrictRef({ trainingId: ..., attendanceUnit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = trainingCheckinsByBranchDistrictRef(dataConnect, trainingCheckinsByBranchDistrictVars);

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

## SearchUncheckedCompanyTargets
You can execute the `SearchUncheckedCompanyTargets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchUncheckedCompanyTargets(vars: SearchUncheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;

interface SearchUncheckedCompanyTargetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchUncheckedCompanyTargetsVariables): QueryRef<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;
}
export const searchUncheckedCompanyTargetsRef: SearchUncheckedCompanyTargetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchUncheckedCompanyTargets(dc: DataConnect, vars: SearchUncheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;

interface SearchUncheckedCompanyTargetsRef {
  ...
  (dc: DataConnect, vars: SearchUncheckedCompanyTargetsVariables): QueryRef<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;
}
export const searchUncheckedCompanyTargetsRef: SearchUncheckedCompanyTargetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchUncheckedCompanyTargetsRef:
```typescript
const name = searchUncheckedCompanyTargetsRef.operationName;
console.log(name);
```

### Variables
The `SearchUncheckedCompanyTargets` query requires an argument of type `SearchUncheckedCompanyTargetsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchUncheckedCompanyTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `SearchUncheckedCompanyTargets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchUncheckedCompanyTargetsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchUncheckedCompanyTargetsData {
  trainingTargets: ({
    targetType: string;
    targetId: string;
    branch: string;
    district?: string | null;
    company: {
      memberNo: string;
      companyName: string;
      email?: string | null;
    } & MemberCompany_Key;
  })[];
}
```
### Using `SearchUncheckedCompanyTargets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchUncheckedCompanyTargets, SearchUncheckedCompanyTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchUncheckedCompanyTargets` query requires an argument of type `SearchUncheckedCompanyTargetsVariables`:
const searchUncheckedCompanyTargetsVars: SearchUncheckedCompanyTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchUncheckedCompanyTargets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchUncheckedCompanyTargets(searchUncheckedCompanyTargetsVars);
// Variables can be defined inline as well.
const { data } = await searchUncheckedCompanyTargets({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchUncheckedCompanyTargets(dataConnect, searchUncheckedCompanyTargetsVars);

console.log(data.trainingTargets);

// Or, you can use the `Promise` API.
searchUncheckedCompanyTargets(searchUncheckedCompanyTargetsVars).then((response) => {
  const data = response.data;
  console.log(data.trainingTargets);
});
```

### Using `SearchUncheckedCompanyTargets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchUncheckedCompanyTargetsRef, SearchUncheckedCompanyTargetsVariables } from '@takken-training/sql-dataconnect';

// The `SearchUncheckedCompanyTargets` query requires an argument of type `SearchUncheckedCompanyTargetsVariables`:
const searchUncheckedCompanyTargetsVars: SearchUncheckedCompanyTargetsVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `searchUncheckedCompanyTargetsRef()` function to get a reference to the query.
const ref = searchUncheckedCompanyTargetsRef(searchUncheckedCompanyTargetsVars);
// Variables can be defined inline as well.
const ref = searchUncheckedCompanyTargetsRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchUncheckedCompanyTargetsRef(dataConnect, searchUncheckedCompanyTargetsVars);

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
    cancelled: boolean;
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

## ListCheckinHistory
You can execute the `ListCheckinHistory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
listCheckinHistory(vars?: ListCheckinHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckinHistoryData, ListCheckinHistoryVariables>;

interface ListCheckinHistoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCheckinHistoryVariables): QueryRef<ListCheckinHistoryData, ListCheckinHistoryVariables>;
}
export const listCheckinHistoryRef: ListCheckinHistoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCheckinHistory(dc: DataConnect, vars?: ListCheckinHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckinHistoryData, ListCheckinHistoryVariables>;

interface ListCheckinHistoryRef {
  ...
  (dc: DataConnect, vars?: ListCheckinHistoryVariables): QueryRef<ListCheckinHistoryData, ListCheckinHistoryVariables>;
}
export const listCheckinHistoryRef: ListCheckinHistoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCheckinHistoryRef:
```typescript
const name = listCheckinHistoryRef.operationName;
console.log(name);
```

### Variables
The `ListCheckinHistory` query has an optional argument of type `ListCheckinHistoryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCheckinHistoryVariables {
  trainingId?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListCheckinHistory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCheckinHistoryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCheckinHistoryData {
  checkins: ({
    checkinId: string;
    trainingId: string;
    checkedInAt: TimestampString;
    checkinMethod: string;
    attendanceUnit: string;
    cancelled: boolean;
    canceledAt?: TimestampString | null;
    canceledBy?: string | null;
    cancelReason?: string | null;
    restoredAt?: TimestampString | null;
    restoredBy?: string | null;
    restoreReason?: string | null;
    training: {
      title: string;
      eventDate: DateString;
    };
    company: {
      memberNo: string;
      companyName: string;
      block: string;
      branch: string;
      district?: string | null;
      email?: string | null;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
      email?: string | null;
    } & Person_Key;
  } & Checkin_Key)[];
}
```
### Using `ListCheckinHistory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCheckinHistory, ListCheckinHistoryVariables } from '@takken-training/sql-dataconnect';

// The `ListCheckinHistory` query has an optional argument of type `ListCheckinHistoryVariables`:
const listCheckinHistoryVars: ListCheckinHistoryVariables = {
  trainingId: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCheckinHistory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCheckinHistory(listCheckinHistoryVars);
// Variables can be defined inline as well.
const { data } = await listCheckinHistory({ trainingId: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCheckinHistoryVariables` argument.
const { data } = await listCheckinHistory();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCheckinHistory(dataConnect, listCheckinHistoryVars);

console.log(data.checkins);

// Or, you can use the `Promise` API.
listCheckinHistory(listCheckinHistoryVars).then((response) => {
  const data = response.data;
  console.log(data.checkins);
});
```

### Using `ListCheckinHistory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCheckinHistoryRef, ListCheckinHistoryVariables } from '@takken-training/sql-dataconnect';

// The `ListCheckinHistory` query has an optional argument of type `ListCheckinHistoryVariables`:
const listCheckinHistoryVars: ListCheckinHistoryVariables = {
  trainingId: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCheckinHistoryRef()` function to get a reference to the query.
const ref = listCheckinHistoryRef(listCheckinHistoryVars);
// Variables can be defined inline as well.
const ref = listCheckinHistoryRef({ trainingId: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCheckinHistoryVariables` argument.
const ref = listCheckinHistoryRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCheckinHistoryRef(dataConnect, listCheckinHistoryVars);

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

## GetPlannedAttendee
You can execute the `GetPlannedAttendee` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
getPlannedAttendee(vars: GetPlannedAttendeeVariables, options?: ExecuteQueryOptions): QueryPromise<GetPlannedAttendeeData, GetPlannedAttendeeVariables>;

interface GetPlannedAttendeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPlannedAttendeeVariables): QueryRef<GetPlannedAttendeeData, GetPlannedAttendeeVariables>;
}
export const getPlannedAttendeeRef: GetPlannedAttendeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPlannedAttendee(dc: DataConnect, vars: GetPlannedAttendeeVariables, options?: ExecuteQueryOptions): QueryPromise<GetPlannedAttendeeData, GetPlannedAttendeeVariables>;

interface GetPlannedAttendeeRef {
  ...
  (dc: DataConnect, vars: GetPlannedAttendeeVariables): QueryRef<GetPlannedAttendeeData, GetPlannedAttendeeVariables>;
}
export const getPlannedAttendeeRef: GetPlannedAttendeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPlannedAttendeeRef:
```typescript
const name = getPlannedAttendeeRef.operationName;
console.log(name);
```

### Variables
The `GetPlannedAttendee` query requires an argument of type `GetPlannedAttendeeVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPlannedAttendeeVariables {
  plannedId: string;
}
```
### Return Type
Recall that executing the `GetPlannedAttendee` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPlannedAttendeeData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPlannedAttendeeData {
  plannedAttendee?: {
    plannedId: string;
    active: boolean;
  } & PlannedAttendee_Key;
}
```
### Using `GetPlannedAttendee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPlannedAttendee, GetPlannedAttendeeVariables } from '@takken-training/sql-dataconnect';

// The `GetPlannedAttendee` query requires an argument of type `GetPlannedAttendeeVariables`:
const getPlannedAttendeeVars: GetPlannedAttendeeVariables = {
  plannedId: ..., 
};

// Call the `getPlannedAttendee()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPlannedAttendee(getPlannedAttendeeVars);
// Variables can be defined inline as well.
const { data } = await getPlannedAttendee({ plannedId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPlannedAttendee(dataConnect, getPlannedAttendeeVars);

console.log(data.plannedAttendee);

// Or, you can use the `Promise` API.
getPlannedAttendee(getPlannedAttendeeVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendee);
});
```

### Using `GetPlannedAttendee`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPlannedAttendeeRef, GetPlannedAttendeeVariables } from '@takken-training/sql-dataconnect';

// The `GetPlannedAttendee` query requires an argument of type `GetPlannedAttendeeVariables`:
const getPlannedAttendeeVars: GetPlannedAttendeeVariables = {
  plannedId: ..., 
};

// Call the `getPlannedAttendeeRef()` function to get a reference to the query.
const ref = getPlannedAttendeeRef(getPlannedAttendeeVars);
// Variables can be defined inline as well.
const ref = getPlannedAttendeeRef({ plannedId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPlannedAttendeeRef(dataConnect, getPlannedAttendeeVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.plannedAttendee);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendee);
});
```

## GetPlannedAttendeeForCheckin
You can execute the `GetPlannedAttendeeForCheckin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
getPlannedAttendeeForCheckin(vars: GetPlannedAttendeeForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetPlannedAttendeeForCheckinData, GetPlannedAttendeeForCheckinVariables>;

interface GetPlannedAttendeeForCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPlannedAttendeeForCheckinVariables): QueryRef<GetPlannedAttendeeForCheckinData, GetPlannedAttendeeForCheckinVariables>;
}
export const getPlannedAttendeeForCheckinRef: GetPlannedAttendeeForCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPlannedAttendeeForCheckin(dc: DataConnect, vars: GetPlannedAttendeeForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetPlannedAttendeeForCheckinData, GetPlannedAttendeeForCheckinVariables>;

interface GetPlannedAttendeeForCheckinRef {
  ...
  (dc: DataConnect, vars: GetPlannedAttendeeForCheckinVariables): QueryRef<GetPlannedAttendeeForCheckinData, GetPlannedAttendeeForCheckinVariables>;
}
export const getPlannedAttendeeForCheckinRef: GetPlannedAttendeeForCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPlannedAttendeeForCheckinRef:
```typescript
const name = getPlannedAttendeeForCheckinRef.operationName;
console.log(name);
```

### Variables
The `GetPlannedAttendeeForCheckin` query requires an argument of type `GetPlannedAttendeeForCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPlannedAttendeeForCheckinVariables {
  plannedId: string;
  trainingId: string;
}
```
### Return Type
Recall that executing the `GetPlannedAttendeeForCheckin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPlannedAttendeeForCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPlannedAttendeeForCheckinData {
  plannedAttendees: ({
    plannedId: string;
    targetType: string;
    targetId: string;
    memberNo?: string | null;
    personalId?: string | null;
    participantName?: string | null;
    company?: {
      memberNo: string;
      companyName: string;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
    } & Person_Key;
  } & PlannedAttendee_Key)[];
}
```
### Using `GetPlannedAttendeeForCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPlannedAttendeeForCheckin, GetPlannedAttendeeForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetPlannedAttendeeForCheckin` query requires an argument of type `GetPlannedAttendeeForCheckinVariables`:
const getPlannedAttendeeForCheckinVars: GetPlannedAttendeeForCheckinVariables = {
  plannedId: ..., 
  trainingId: ..., 
};

// Call the `getPlannedAttendeeForCheckin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPlannedAttendeeForCheckin(getPlannedAttendeeForCheckinVars);
// Variables can be defined inline as well.
const { data } = await getPlannedAttendeeForCheckin({ plannedId: ..., trainingId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPlannedAttendeeForCheckin(dataConnect, getPlannedAttendeeForCheckinVars);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
getPlannedAttendeeForCheckin(getPlannedAttendeeForCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

### Using `GetPlannedAttendeeForCheckin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPlannedAttendeeForCheckinRef, GetPlannedAttendeeForCheckinVariables } from '@takken-training/sql-dataconnect';

// The `GetPlannedAttendeeForCheckin` query requires an argument of type `GetPlannedAttendeeForCheckinVariables`:
const getPlannedAttendeeForCheckinVars: GetPlannedAttendeeForCheckinVariables = {
  plannedId: ..., 
  trainingId: ..., 
};

// Call the `getPlannedAttendeeForCheckinRef()` function to get a reference to the query.
const ref = getPlannedAttendeeForCheckinRef(getPlannedAttendeeForCheckinVars);
// Variables can be defined inline as well.
const ref = getPlannedAttendeeForCheckinRef({ plannedId: ..., trainingId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPlannedAttendeeForCheckinRef(dataConnect, getPlannedAttendeeForCheckinVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

## ListPlannedAttendees
You can execute the `ListPlannedAttendees` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
listPlannedAttendees(vars: ListPlannedAttendeesVariables, options?: ExecuteQueryOptions): QueryPromise<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;

interface ListPlannedAttendeesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListPlannedAttendeesVariables): QueryRef<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;
}
export const listPlannedAttendeesRef: ListPlannedAttendeesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPlannedAttendees(dc: DataConnect, vars: ListPlannedAttendeesVariables, options?: ExecuteQueryOptions): QueryPromise<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;

interface ListPlannedAttendeesRef {
  ...
  (dc: DataConnect, vars: ListPlannedAttendeesVariables): QueryRef<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;
}
export const listPlannedAttendeesRef: ListPlannedAttendeesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPlannedAttendeesRef:
```typescript
const name = listPlannedAttendeesRef.operationName;
console.log(name);
```

### Variables
The `ListPlannedAttendees` query requires an argument of type `ListPlannedAttendeesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListPlannedAttendeesVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListPlannedAttendees` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPlannedAttendeesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPlannedAttendeesData {
  plannedAttendees: ({
    plannedId: string;
    targetType: string;
    targetId: string;
    participantName?: string | null;
    email?: string | null;
    branch?: string | null;
    district?: string | null;
    block?: string | null;
    source?: string | null;
    createdAt: TimestampString;
    company?: {
      memberNo: string;
      companyName: string;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
      email?: string | null;
    } & Person_Key;
  } & PlannedAttendee_Key)[];
}
```
### Using `ListPlannedAttendees`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPlannedAttendees, ListPlannedAttendeesVariables } from '@takken-training/sql-dataconnect';

// The `ListPlannedAttendees` query requires an argument of type `ListPlannedAttendeesVariables`:
const listPlannedAttendeesVars: ListPlannedAttendeesVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listPlannedAttendees()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPlannedAttendees(listPlannedAttendeesVars);
// Variables can be defined inline as well.
const { data } = await listPlannedAttendees({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPlannedAttendees(dataConnect, listPlannedAttendeesVars);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
listPlannedAttendees(listPlannedAttendeesVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

### Using `ListPlannedAttendees`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPlannedAttendeesRef, ListPlannedAttendeesVariables } from '@takken-training/sql-dataconnect';

// The `ListPlannedAttendees` query requires an argument of type `ListPlannedAttendeesVariables`:
const listPlannedAttendeesVars: ListPlannedAttendeesVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listPlannedAttendeesRef()` function to get a reference to the query.
const ref = listPlannedAttendeesRef(listPlannedAttendeesVars);
// Variables can be defined inline as well.
const ref = listPlannedAttendeesRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPlannedAttendeesRef(dataConnect, listPlannedAttendeesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

## PlannedAttendeeSummary
You can execute the `PlannedAttendeeSummary` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
plannedAttendeeSummary(vars: PlannedAttendeeSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;

interface PlannedAttendeeSummaryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlannedAttendeeSummaryVariables): QueryRef<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;
}
export const plannedAttendeeSummaryRef: PlannedAttendeeSummaryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
plannedAttendeeSummary(dc: DataConnect, vars: PlannedAttendeeSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;

interface PlannedAttendeeSummaryRef {
  ...
  (dc: DataConnect, vars: PlannedAttendeeSummaryVariables): QueryRef<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;
}
export const plannedAttendeeSummaryRef: PlannedAttendeeSummaryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the plannedAttendeeSummaryRef:
```typescript
const name = plannedAttendeeSummaryRef.operationName;
console.log(name);
```

### Variables
The `PlannedAttendeeSummary` query requires an argument of type `PlannedAttendeeSummaryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PlannedAttendeeSummaryVariables {
  trainingId: string;
}
```
### Return Type
Recall that executing the `PlannedAttendeeSummary` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlannedAttendeeSummaryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlannedAttendeeSummaryData {
  planned: ({
    _count: number;
  })[];
  personalReceived: ({
    _count: number;
  })[];
  companyReceived: ({
    _count: number;
  })[];
}
```
### Using `PlannedAttendeeSummary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, plannedAttendeeSummary, PlannedAttendeeSummaryVariables } from '@takken-training/sql-dataconnect';

// The `PlannedAttendeeSummary` query requires an argument of type `PlannedAttendeeSummaryVariables`:
const plannedAttendeeSummaryVars: PlannedAttendeeSummaryVariables = {
  trainingId: ..., 
};

// Call the `plannedAttendeeSummary()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await plannedAttendeeSummary(plannedAttendeeSummaryVars);
// Variables can be defined inline as well.
const { data } = await plannedAttendeeSummary({ trainingId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await plannedAttendeeSummary(dataConnect, plannedAttendeeSummaryVars);

console.log(data.planned);
console.log(data.personalReceived);
console.log(data.companyReceived);

// Or, you can use the `Promise` API.
plannedAttendeeSummary(plannedAttendeeSummaryVars).then((response) => {
  const data = response.data;
  console.log(data.planned);
  console.log(data.personalReceived);
  console.log(data.companyReceived);
});
```

### Using `PlannedAttendeeSummary`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, plannedAttendeeSummaryRef, PlannedAttendeeSummaryVariables } from '@takken-training/sql-dataconnect';

// The `PlannedAttendeeSummary` query requires an argument of type `PlannedAttendeeSummaryVariables`:
const plannedAttendeeSummaryVars: PlannedAttendeeSummaryVariables = {
  trainingId: ..., 
};

// Call the `plannedAttendeeSummaryRef()` function to get a reference to the query.
const ref = plannedAttendeeSummaryRef(plannedAttendeeSummaryVars);
// Variables can be defined inline as well.
const ref = plannedAttendeeSummaryRef({ trainingId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = plannedAttendeeSummaryRef(dataConnect, plannedAttendeeSummaryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.planned);
console.log(data.personalReceived);
console.log(data.companyReceived);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.planned);
  console.log(data.personalReceived);
  console.log(data.companyReceived);
});
```

## ListCheckedPlannedPersonal
You can execute the `ListCheckedPlannedPersonal` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
listCheckedPlannedPersonal(vars: ListCheckedPlannedPersonalVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;

interface ListCheckedPlannedPersonalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCheckedPlannedPersonalVariables): QueryRef<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;
}
export const listCheckedPlannedPersonalRef: ListCheckedPlannedPersonalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCheckedPlannedPersonal(dc: DataConnect, vars: ListCheckedPlannedPersonalVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;

interface ListCheckedPlannedPersonalRef {
  ...
  (dc: DataConnect, vars: ListCheckedPlannedPersonalVariables): QueryRef<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;
}
export const listCheckedPlannedPersonalRef: ListCheckedPlannedPersonalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCheckedPlannedPersonalRef:
```typescript
const name = listCheckedPlannedPersonalRef.operationName;
console.log(name);
```

### Variables
The `ListCheckedPlannedPersonal` query requires an argument of type `ListCheckedPlannedPersonalVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCheckedPlannedPersonalVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListCheckedPlannedPersonal` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCheckedPlannedPersonalData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCheckedPlannedPersonalData {
  plannedAttendees: ({
    plannedId: string;
    targetType: string;
    targetId: string;
    participantName?: string | null;
    email?: string | null;
    branch?: string | null;
    district?: string | null;
    block?: string | null;
    source?: string | null;
    createdAt: TimestampString;
    company?: {
      memberNo: string;
      companyName: string;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
      email?: string | null;
    } & Person_Key;
  } & PlannedAttendee_Key)[];
}
```
### Using `ListCheckedPlannedPersonal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCheckedPlannedPersonal, ListCheckedPlannedPersonalVariables } from '@takken-training/sql-dataconnect';

// The `ListCheckedPlannedPersonal` query requires an argument of type `ListCheckedPlannedPersonalVariables`:
const listCheckedPlannedPersonalVars: ListCheckedPlannedPersonalVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCheckedPlannedPersonal()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCheckedPlannedPersonal(listCheckedPlannedPersonalVars);
// Variables can be defined inline as well.
const { data } = await listCheckedPlannedPersonal({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCheckedPlannedPersonal(dataConnect, listCheckedPlannedPersonalVars);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
listCheckedPlannedPersonal(listCheckedPlannedPersonalVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

### Using `ListCheckedPlannedPersonal`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCheckedPlannedPersonalRef, ListCheckedPlannedPersonalVariables } from '@takken-training/sql-dataconnect';

// The `ListCheckedPlannedPersonal` query requires an argument of type `ListCheckedPlannedPersonalVariables`:
const listCheckedPlannedPersonalVars: ListCheckedPlannedPersonalVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCheckedPlannedPersonalRef()` function to get a reference to the query.
const ref = listCheckedPlannedPersonalRef(listCheckedPlannedPersonalVars);
// Variables can be defined inline as well.
const ref = listCheckedPlannedPersonalRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCheckedPlannedPersonalRef(dataConnect, listCheckedPlannedPersonalVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

## ListCheckedPlannedCompany
You can execute the `ListCheckedPlannedCompany` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
listCheckedPlannedCompany(vars: ListCheckedPlannedCompanyVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;

interface ListCheckedPlannedCompanyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCheckedPlannedCompanyVariables): QueryRef<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;
}
export const listCheckedPlannedCompanyRef: ListCheckedPlannedCompanyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCheckedPlannedCompany(dc: DataConnect, vars: ListCheckedPlannedCompanyVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;

interface ListCheckedPlannedCompanyRef {
  ...
  (dc: DataConnect, vars: ListCheckedPlannedCompanyVariables): QueryRef<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;
}
export const listCheckedPlannedCompanyRef: ListCheckedPlannedCompanyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCheckedPlannedCompanyRef:
```typescript
const name = listCheckedPlannedCompanyRef.operationName;
console.log(name);
```

### Variables
The `ListCheckedPlannedCompany` query requires an argument of type `ListCheckedPlannedCompanyVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCheckedPlannedCompanyVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListCheckedPlannedCompany` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCheckedPlannedCompanyData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCheckedPlannedCompanyData {
  plannedAttendees: ({
    plannedId: string;
    targetType: string;
    targetId: string;
    participantName?: string | null;
    email?: string | null;
    branch?: string | null;
    district?: string | null;
    block?: string | null;
    source?: string | null;
    createdAt: TimestampString;
    company?: {
      memberNo: string;
      companyName: string;
    } & MemberCompany_Key;
    person?: {
      personalId: string;
      name: string;
      email?: string | null;
    } & Person_Key;
  } & PlannedAttendee_Key)[];
}
```
### Using `ListCheckedPlannedCompany`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCheckedPlannedCompany, ListCheckedPlannedCompanyVariables } from '@takken-training/sql-dataconnect';

// The `ListCheckedPlannedCompany` query requires an argument of type `ListCheckedPlannedCompanyVariables`:
const listCheckedPlannedCompanyVars: ListCheckedPlannedCompanyVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCheckedPlannedCompany()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCheckedPlannedCompany(listCheckedPlannedCompanyVars);
// Variables can be defined inline as well.
const { data } = await listCheckedPlannedCompany({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCheckedPlannedCompany(dataConnect, listCheckedPlannedCompanyVars);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
listCheckedPlannedCompany(listCheckedPlannedCompanyVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
});
```

### Using `ListCheckedPlannedCompany`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCheckedPlannedCompanyRef, ListCheckedPlannedCompanyVariables } from '@takken-training/sql-dataconnect';

// The `ListCheckedPlannedCompany` query requires an argument of type `ListCheckedPlannedCompanyVariables`:
const listCheckedPlannedCompanyVars: ListCheckedPlannedCompanyVariables = {
  trainingId: ..., 
  branch: ..., // optional
  district: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCheckedPlannedCompanyRef()` function to get a reference to the query.
const ref = listCheckedPlannedCompanyRef(listCheckedPlannedCompanyVars);
// Variables can be defined inline as well.
const ref = listCheckedPlannedCompanyRef({ trainingId: ..., branch: ..., district: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCheckedPlannedCompanyRef(dataConnect, listCheckedPlannedCompanyVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.plannedAttendees);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendees);
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

## RegisterNewPersonalCheckin
You can execute the `RegisterNewPersonalCheckin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
registerNewPersonalCheckin(vars: RegisterNewPersonalCheckinVariables): MutationPromise<RegisterNewPersonalCheckinData, RegisterNewPersonalCheckinVariables>;

interface RegisterNewPersonalCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterNewPersonalCheckinVariables): MutationRef<RegisterNewPersonalCheckinData, RegisterNewPersonalCheckinVariables>;
}
export const registerNewPersonalCheckinRef: RegisterNewPersonalCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerNewPersonalCheckin(dc: DataConnect, vars: RegisterNewPersonalCheckinVariables): MutationPromise<RegisterNewPersonalCheckinData, RegisterNewPersonalCheckinVariables>;

interface RegisterNewPersonalCheckinRef {
  ...
  (dc: DataConnect, vars: RegisterNewPersonalCheckinVariables): MutationRef<RegisterNewPersonalCheckinData, RegisterNewPersonalCheckinVariables>;
}
export const registerNewPersonalCheckinRef: RegisterNewPersonalCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerNewPersonalCheckinRef:
```typescript
const name = registerNewPersonalCheckinRef.operationName;
console.log(name);
```

### Variables
The `RegisterNewPersonalCheckin` mutation requires an argument of type `RegisterNewPersonalCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterNewPersonalCheckinVariables {
  checkinId: string;
  trainingId: string;
  memberNo: string;
  personalId: string;
  participantName: string;
  email?: string | null;
  checkinMethod: string;
}
```
### Return Type
Recall that executing the `RegisterNewPersonalCheckin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterNewPersonalCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterNewPersonalCheckinData {
  person_upsert: Person_Key;
  checkin_insert: Checkin_Key;
}
```
### Using `RegisterNewPersonalCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerNewPersonalCheckin, RegisterNewPersonalCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterNewPersonalCheckin` mutation requires an argument of type `RegisterNewPersonalCheckinVariables`:
const registerNewPersonalCheckinVars: RegisterNewPersonalCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  memberNo: ..., 
  personalId: ..., 
  participantName: ..., 
  email: ..., // optional
  checkinMethod: ..., 
};

// Call the `registerNewPersonalCheckin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerNewPersonalCheckin(registerNewPersonalCheckinVars);
// Variables can be defined inline as well.
const { data } = await registerNewPersonalCheckin({ checkinId: ..., trainingId: ..., memberNo: ..., personalId: ..., participantName: ..., email: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerNewPersonalCheckin(dataConnect, registerNewPersonalCheckinVars);

console.log(data.person_upsert);
console.log(data.checkin_insert);

// Or, you can use the `Promise` API.
registerNewPersonalCheckin(registerNewPersonalCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.person_upsert);
  console.log(data.checkin_insert);
});
```

### Using `RegisterNewPersonalCheckin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerNewPersonalCheckinRef, RegisterNewPersonalCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterNewPersonalCheckin` mutation requires an argument of type `RegisterNewPersonalCheckinVariables`:
const registerNewPersonalCheckinVars: RegisterNewPersonalCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  memberNo: ..., 
  personalId: ..., 
  participantName: ..., 
  email: ..., // optional
  checkinMethod: ..., 
};

// Call the `registerNewPersonalCheckinRef()` function to get a reference to the mutation.
const ref = registerNewPersonalCheckinRef(registerNewPersonalCheckinVars);
// Variables can be defined inline as well.
const ref = registerNewPersonalCheckinRef({ checkinId: ..., trainingId: ..., memberNo: ..., personalId: ..., participantName: ..., email: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerNewPersonalCheckinRef(dataConnect, registerNewPersonalCheckinVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.person_upsert);
console.log(data.checkin_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.person_upsert);
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

## RegisterGuestCheckin
You can execute the `RegisterGuestCheckin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
registerGuestCheckin(vars: RegisterGuestCheckinVariables): MutationPromise<RegisterGuestCheckinData, RegisterGuestCheckinVariables>;

interface RegisterGuestCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterGuestCheckinVariables): MutationRef<RegisterGuestCheckinData, RegisterGuestCheckinVariables>;
}
export const registerGuestCheckinRef: RegisterGuestCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerGuestCheckin(dc: DataConnect, vars: RegisterGuestCheckinVariables): MutationPromise<RegisterGuestCheckinData, RegisterGuestCheckinVariables>;

interface RegisterGuestCheckinRef {
  ...
  (dc: DataConnect, vars: RegisterGuestCheckinVariables): MutationRef<RegisterGuestCheckinData, RegisterGuestCheckinVariables>;
}
export const registerGuestCheckinRef: RegisterGuestCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerGuestCheckinRef:
```typescript
const name = registerGuestCheckinRef.operationName;
console.log(name);
```

### Variables
The `RegisterGuestCheckin` mutation requires an argument of type `RegisterGuestCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterGuestCheckinVariables {
  checkinId: string;
  trainingId: string;
  guestKey: string;
  participantName: string;
  organizationName?: string | null;
  block?: string | null;
  branch?: string | null;
  email?: string | null;
  phone?: string | null;
  receptionCategory?: string;
  checkinMethod: string;
}
```
### Return Type
Recall that executing the `RegisterGuestCheckin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterGuestCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterGuestCheckinData {
  guestCheckin_insert: GuestCheckin_Key;
}
```
### Using `RegisterGuestCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerGuestCheckin, RegisterGuestCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterGuestCheckin` mutation requires an argument of type `RegisterGuestCheckinVariables`:
const registerGuestCheckinVars: RegisterGuestCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  guestKey: ..., 
  participantName: ..., 
  organizationName: ..., // optional
  block: ..., // optional
  branch: ..., // optional
  email: ..., // optional
  phone: ..., // optional
  receptionCategory: ..., // optional
  checkinMethod: ..., 
};

// Call the `registerGuestCheckin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerGuestCheckin(registerGuestCheckinVars);
// Variables can be defined inline as well.
const { data } = await registerGuestCheckin({ checkinId: ..., trainingId: ..., guestKey: ..., participantName: ..., organizationName: ..., block: ..., branch: ..., email: ..., phone: ..., receptionCategory: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerGuestCheckin(dataConnect, registerGuestCheckinVars);

console.log(data.guestCheckin_insert);

// Or, you can use the `Promise` API.
registerGuestCheckin(registerGuestCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.guestCheckin_insert);
});
```

### Using `RegisterGuestCheckin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerGuestCheckinRef, RegisterGuestCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RegisterGuestCheckin` mutation requires an argument of type `RegisterGuestCheckinVariables`:
const registerGuestCheckinVars: RegisterGuestCheckinVariables = {
  checkinId: ..., 
  trainingId: ..., 
  guestKey: ..., 
  participantName: ..., 
  organizationName: ..., // optional
  block: ..., // optional
  branch: ..., // optional
  email: ..., // optional
  phone: ..., // optional
  receptionCategory: ..., // optional
  checkinMethod: ..., 
};

// Call the `registerGuestCheckinRef()` function to get a reference to the mutation.
const ref = registerGuestCheckinRef(registerGuestCheckinVars);
// Variables can be defined inline as well.
const ref = registerGuestCheckinRef({ checkinId: ..., trainingId: ..., guestKey: ..., participantName: ..., organizationName: ..., block: ..., branch: ..., email: ..., phone: ..., receptionCategory: ..., checkinMethod: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerGuestCheckinRef(dataConnect, registerGuestCheckinVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.guestCheckin_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.guestCheckin_insert);
});
```

## CancelCheckin
You can execute the `CancelCheckin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
cancelCheckin(vars: CancelCheckinVariables): MutationPromise<CancelCheckinData, CancelCheckinVariables>;

interface CancelCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelCheckinVariables): MutationRef<CancelCheckinData, CancelCheckinVariables>;
}
export const cancelCheckinRef: CancelCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
cancelCheckin(dc: DataConnect, vars: CancelCheckinVariables): MutationPromise<CancelCheckinData, CancelCheckinVariables>;

interface CancelCheckinRef {
  ...
  (dc: DataConnect, vars: CancelCheckinVariables): MutationRef<CancelCheckinData, CancelCheckinVariables>;
}
export const cancelCheckinRef: CancelCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the cancelCheckinRef:
```typescript
const name = cancelCheckinRef.operationName;
console.log(name);
```

### Variables
The `CancelCheckin` mutation requires an argument of type `CancelCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CancelCheckinVariables {
  checkinId: string;
  changedAt: TimestampString;
  operator?: string | null;
  reason?: string | null;
}
```
### Return Type
Recall that executing the `CancelCheckin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CancelCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CancelCheckinData {
  checkin_update?: Checkin_Key | null;
}
```
### Using `CancelCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, cancelCheckin, CancelCheckinVariables } from '@takken-training/sql-dataconnect';

// The `CancelCheckin` mutation requires an argument of type `CancelCheckinVariables`:
const cancelCheckinVars: CancelCheckinVariables = {
  checkinId: ..., 
  changedAt: ..., 
  operator: ..., // optional
  reason: ..., // optional
};

// Call the `cancelCheckin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await cancelCheckin(cancelCheckinVars);
// Variables can be defined inline as well.
const { data } = await cancelCheckin({ checkinId: ..., changedAt: ..., operator: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await cancelCheckin(dataConnect, cancelCheckinVars);

console.log(data.checkin_update);

// Or, you can use the `Promise` API.
cancelCheckin(cancelCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.checkin_update);
});
```

### Using `CancelCheckin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, cancelCheckinRef, CancelCheckinVariables } from '@takken-training/sql-dataconnect';

// The `CancelCheckin` mutation requires an argument of type `CancelCheckinVariables`:
const cancelCheckinVars: CancelCheckinVariables = {
  checkinId: ..., 
  changedAt: ..., 
  operator: ..., // optional
  reason: ..., // optional
};

// Call the `cancelCheckinRef()` function to get a reference to the mutation.
const ref = cancelCheckinRef(cancelCheckinVars);
// Variables can be defined inline as well.
const ref = cancelCheckinRef({ checkinId: ..., changedAt: ..., operator: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = cancelCheckinRef(dataConnect, cancelCheckinVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.checkin_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.checkin_update);
});
```

## RestoreCheckin
You can execute the `RestoreCheckin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
restoreCheckin(vars: RestoreCheckinVariables): MutationPromise<RestoreCheckinData, RestoreCheckinVariables>;

interface RestoreCheckinRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreCheckinVariables): MutationRef<RestoreCheckinData, RestoreCheckinVariables>;
}
export const restoreCheckinRef: RestoreCheckinRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
restoreCheckin(dc: DataConnect, vars: RestoreCheckinVariables): MutationPromise<RestoreCheckinData, RestoreCheckinVariables>;

interface RestoreCheckinRef {
  ...
  (dc: DataConnect, vars: RestoreCheckinVariables): MutationRef<RestoreCheckinData, RestoreCheckinVariables>;
}
export const restoreCheckinRef: RestoreCheckinRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the restoreCheckinRef:
```typescript
const name = restoreCheckinRef.operationName;
console.log(name);
```

### Variables
The `RestoreCheckin` mutation requires an argument of type `RestoreCheckinVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RestoreCheckinVariables {
  checkinId: string;
  changedAt: TimestampString;
  operator?: string | null;
  reason?: string | null;
}
```
### Return Type
Recall that executing the `RestoreCheckin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RestoreCheckinData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RestoreCheckinData {
  checkin_update?: Checkin_Key | null;
}
```
### Using `RestoreCheckin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, restoreCheckin, RestoreCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RestoreCheckin` mutation requires an argument of type `RestoreCheckinVariables`:
const restoreCheckinVars: RestoreCheckinVariables = {
  checkinId: ..., 
  changedAt: ..., 
  operator: ..., // optional
  reason: ..., // optional
};

// Call the `restoreCheckin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await restoreCheckin(restoreCheckinVars);
// Variables can be defined inline as well.
const { data } = await restoreCheckin({ checkinId: ..., changedAt: ..., operator: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await restoreCheckin(dataConnect, restoreCheckinVars);

console.log(data.checkin_update);

// Or, you can use the `Promise` API.
restoreCheckin(restoreCheckinVars).then((response) => {
  const data = response.data;
  console.log(data.checkin_update);
});
```

### Using `RestoreCheckin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, restoreCheckinRef, RestoreCheckinVariables } from '@takken-training/sql-dataconnect';

// The `RestoreCheckin` mutation requires an argument of type `RestoreCheckinVariables`:
const restoreCheckinVars: RestoreCheckinVariables = {
  checkinId: ..., 
  changedAt: ..., 
  operator: ..., // optional
  reason: ..., // optional
};

// Call the `restoreCheckinRef()` function to get a reference to the mutation.
const ref = restoreCheckinRef(restoreCheckinVars);
// Variables can be defined inline as well.
const ref = restoreCheckinRef({ checkinId: ..., changedAt: ..., operator: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = restoreCheckinRef(dataConnect, restoreCheckinVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.checkin_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.checkin_update);
});
```

## RestoreCancelledCheckinPublic
You can execute the `RestoreCancelledCheckinPublic` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
restoreCancelledCheckinPublic(vars: RestoreCancelledCheckinPublicVariables): MutationPromise<RestoreCancelledCheckinPublicData, RestoreCancelledCheckinPublicVariables>;

interface RestoreCancelledCheckinPublicRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreCancelledCheckinPublicVariables): MutationRef<RestoreCancelledCheckinPublicData, RestoreCancelledCheckinPublicVariables>;
}
export const restoreCancelledCheckinPublicRef: RestoreCancelledCheckinPublicRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
restoreCancelledCheckinPublic(dc: DataConnect, vars: RestoreCancelledCheckinPublicVariables): MutationPromise<RestoreCancelledCheckinPublicData, RestoreCancelledCheckinPublicVariables>;

interface RestoreCancelledCheckinPublicRef {
  ...
  (dc: DataConnect, vars: RestoreCancelledCheckinPublicVariables): MutationRef<RestoreCancelledCheckinPublicData, RestoreCancelledCheckinPublicVariables>;
}
export const restoreCancelledCheckinPublicRef: RestoreCancelledCheckinPublicRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the restoreCancelledCheckinPublicRef:
```typescript
const name = restoreCancelledCheckinPublicRef.operationName;
console.log(name);
```

### Variables
The `RestoreCancelledCheckinPublic` mutation requires an argument of type `RestoreCancelledCheckinPublicVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RestoreCancelledCheckinPublicVariables {
  checkinId: string;
  changedAt: TimestampString;
}
```
### Return Type
Recall that executing the `RestoreCancelledCheckinPublic` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RestoreCancelledCheckinPublicData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RestoreCancelledCheckinPublicData {
  checkin_updateMany: number;
}
```
### Using `RestoreCancelledCheckinPublic`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, restoreCancelledCheckinPublic, RestoreCancelledCheckinPublicVariables } from '@takken-training/sql-dataconnect';

// The `RestoreCancelledCheckinPublic` mutation requires an argument of type `RestoreCancelledCheckinPublicVariables`:
const restoreCancelledCheckinPublicVars: RestoreCancelledCheckinPublicVariables = {
  checkinId: ..., 
  changedAt: ..., 
};

// Call the `restoreCancelledCheckinPublic()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await restoreCancelledCheckinPublic(restoreCancelledCheckinPublicVars);
// Variables can be defined inline as well.
const { data } = await restoreCancelledCheckinPublic({ checkinId: ..., changedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await restoreCancelledCheckinPublic(dataConnect, restoreCancelledCheckinPublicVars);

console.log(data.checkin_updateMany);

// Or, you can use the `Promise` API.
restoreCancelledCheckinPublic(restoreCancelledCheckinPublicVars).then((response) => {
  const data = response.data;
  console.log(data.checkin_updateMany);
});
```

### Using `RestoreCancelledCheckinPublic`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, restoreCancelledCheckinPublicRef, RestoreCancelledCheckinPublicVariables } from '@takken-training/sql-dataconnect';

// The `RestoreCancelledCheckinPublic` mutation requires an argument of type `RestoreCancelledCheckinPublicVariables`:
const restoreCancelledCheckinPublicVars: RestoreCancelledCheckinPublicVariables = {
  checkinId: ..., 
  changedAt: ..., 
};

// Call the `restoreCancelledCheckinPublicRef()` function to get a reference to the mutation.
const ref = restoreCancelledCheckinPublicRef(restoreCancelledCheckinPublicVars);
// Variables can be defined inline as well.
const ref = restoreCancelledCheckinPublicRef({ checkinId: ..., changedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = restoreCancelledCheckinPublicRef(dataConnect, restoreCancelledCheckinPublicVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.checkin_updateMany);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.checkin_updateMany);
});
```

## AddPlannedAttendee
You can execute the `AddPlannedAttendee` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
addPlannedAttendee(vars: AddPlannedAttendeeVariables): MutationPromise<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;

interface AddPlannedAttendeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddPlannedAttendeeVariables): MutationRef<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;
}
export const addPlannedAttendeeRef: AddPlannedAttendeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addPlannedAttendee(dc: DataConnect, vars: AddPlannedAttendeeVariables): MutationPromise<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;

interface AddPlannedAttendeeRef {
  ...
  (dc: DataConnect, vars: AddPlannedAttendeeVariables): MutationRef<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;
}
export const addPlannedAttendeeRef: AddPlannedAttendeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addPlannedAttendeeRef:
```typescript
const name = addPlannedAttendeeRef.operationName;
console.log(name);
```

### Variables
The `AddPlannedAttendee` mutation requires an argument of type `AddPlannedAttendeeVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddPlannedAttendeeVariables {
  plannedId: string;
  trainingId: string;
  targetType: string;
  targetId: string;
  memberNo?: string | null;
  personalId?: string | null;
  participantName?: string | null;
  email?: string | null;
  branch?: string | null;
  district?: string | null;
  block?: string | null;
  source?: string | null;
}
```
### Return Type
Recall that executing the `AddPlannedAttendee` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddPlannedAttendeeData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddPlannedAttendeeData {
  plannedAttendee_upsert: PlannedAttendee_Key;
}
```
### Using `AddPlannedAttendee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addPlannedAttendee, AddPlannedAttendeeVariables } from '@takken-training/sql-dataconnect';

// The `AddPlannedAttendee` mutation requires an argument of type `AddPlannedAttendeeVariables`:
const addPlannedAttendeeVars: AddPlannedAttendeeVariables = {
  plannedId: ..., 
  trainingId: ..., 
  targetType: ..., 
  targetId: ..., 
  memberNo: ..., // optional
  personalId: ..., // optional
  participantName: ..., // optional
  email: ..., // optional
  branch: ..., // optional
  district: ..., // optional
  block: ..., // optional
  source: ..., // optional
};

// Call the `addPlannedAttendee()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addPlannedAttendee(addPlannedAttendeeVars);
// Variables can be defined inline as well.
const { data } = await addPlannedAttendee({ plannedId: ..., trainingId: ..., targetType: ..., targetId: ..., memberNo: ..., personalId: ..., participantName: ..., email: ..., branch: ..., district: ..., block: ..., source: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addPlannedAttendee(dataConnect, addPlannedAttendeeVars);

console.log(data.plannedAttendee_upsert);

// Or, you can use the `Promise` API.
addPlannedAttendee(addPlannedAttendeeVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendee_upsert);
});
```

### Using `AddPlannedAttendee`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addPlannedAttendeeRef, AddPlannedAttendeeVariables } from '@takken-training/sql-dataconnect';

// The `AddPlannedAttendee` mutation requires an argument of type `AddPlannedAttendeeVariables`:
const addPlannedAttendeeVars: AddPlannedAttendeeVariables = {
  plannedId: ..., 
  trainingId: ..., 
  targetType: ..., 
  targetId: ..., 
  memberNo: ..., // optional
  personalId: ..., // optional
  participantName: ..., // optional
  email: ..., // optional
  branch: ..., // optional
  district: ..., // optional
  block: ..., // optional
  source: ..., // optional
};

// Call the `addPlannedAttendeeRef()` function to get a reference to the mutation.
const ref = addPlannedAttendeeRef(addPlannedAttendeeVars);
// Variables can be defined inline as well.
const ref = addPlannedAttendeeRef({ plannedId: ..., trainingId: ..., targetType: ..., targetId: ..., memberNo: ..., personalId: ..., participantName: ..., email: ..., branch: ..., district: ..., block: ..., source: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addPlannedAttendeeRef(dataConnect, addPlannedAttendeeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.plannedAttendee_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendee_upsert);
});
```

## RemovePlannedAttendee
You can execute the `RemovePlannedAttendee` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
removePlannedAttendee(vars: RemovePlannedAttendeeVariables): MutationPromise<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;

interface RemovePlannedAttendeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemovePlannedAttendeeVariables): MutationRef<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;
}
export const removePlannedAttendeeRef: RemovePlannedAttendeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removePlannedAttendee(dc: DataConnect, vars: RemovePlannedAttendeeVariables): MutationPromise<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;

interface RemovePlannedAttendeeRef {
  ...
  (dc: DataConnect, vars: RemovePlannedAttendeeVariables): MutationRef<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;
}
export const removePlannedAttendeeRef: RemovePlannedAttendeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removePlannedAttendeeRef:
```typescript
const name = removePlannedAttendeeRef.operationName;
console.log(name);
```

### Variables
The `RemovePlannedAttendee` mutation requires an argument of type `RemovePlannedAttendeeVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemovePlannedAttendeeVariables {
  plannedId: string;
  changedAt: TimestampString;
  operator?: string | null;
}
```
### Return Type
Recall that executing the `RemovePlannedAttendee` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemovePlannedAttendeeData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RemovePlannedAttendeeData {
  plannedAttendee_update?: PlannedAttendee_Key | null;
}
```
### Using `RemovePlannedAttendee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removePlannedAttendee, RemovePlannedAttendeeVariables } from '@takken-training/sql-dataconnect';

// The `RemovePlannedAttendee` mutation requires an argument of type `RemovePlannedAttendeeVariables`:
const removePlannedAttendeeVars: RemovePlannedAttendeeVariables = {
  plannedId: ..., 
  changedAt: ..., 
  operator: ..., // optional
};

// Call the `removePlannedAttendee()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removePlannedAttendee(removePlannedAttendeeVars);
// Variables can be defined inline as well.
const { data } = await removePlannedAttendee({ plannedId: ..., changedAt: ..., operator: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removePlannedAttendee(dataConnect, removePlannedAttendeeVars);

console.log(data.plannedAttendee_update);

// Or, you can use the `Promise` API.
removePlannedAttendee(removePlannedAttendeeVars).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendee_update);
});
```

### Using `RemovePlannedAttendee`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removePlannedAttendeeRef, RemovePlannedAttendeeVariables } from '@takken-training/sql-dataconnect';

// The `RemovePlannedAttendee` mutation requires an argument of type `RemovePlannedAttendeeVariables`:
const removePlannedAttendeeVars: RemovePlannedAttendeeVariables = {
  plannedId: ..., 
  changedAt: ..., 
  operator: ..., // optional
};

// Call the `removePlannedAttendeeRef()` function to get a reference to the mutation.
const ref = removePlannedAttendeeRef(removePlannedAttendeeVars);
// Variables can be defined inline as well.
const ref = removePlannedAttendeeRef({ plannedId: ..., changedAt: ..., operator: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removePlannedAttendeeRef(dataConnect, removePlannedAttendeeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.plannedAttendee_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.plannedAttendee_update);
});
```

