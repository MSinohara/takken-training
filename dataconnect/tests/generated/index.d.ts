import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Checkin_Key {
  checkinId: string;
  __typename?: 'Checkin_Key';
}

export interface GetCheckinData {
  checkin?: {
    checkinId: string;
    trainingId: string;
    attendanceUnit: string;
    targetId: string;
    checkedInAt: TimestampString;
  } & Checkin_Key;
}

export interface GetCheckinVariables {
  checkinId: string;
}

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

export interface GetPersonForCheckinVariables {
  personalId: string;
}

export interface ListTrainingsData {
  trainings: ({
    trainingId: string;
    title: string;
    eventDate: DateString;
  } & Training_Key)[];
}

export interface ListTrainingsVariables {
  limit?: number | null;
}

export interface MemberCompany_Key {
  memberNo: string;
  __typename?: 'MemberCompany_Key';
}

export interface Person_Key {
  personalId: string;
  __typename?: 'Person_Key';
}

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

export interface RecentCheckinsVariables {
  trainingId: string;
  limit?: number | null;
}

export interface RegisterCompanyCheckinData {
  checkin_insert: Checkin_Key;
}

export interface RegisterCompanyCheckinVariables {
  checkinId: string;
  trainingId: string;
  memberNo: string;
  checkinMethod: string;
}

export interface RegisterPersonalCheckinData {
  checkin_insert: Checkin_Key;
}

export interface RegisterPersonalCheckinVariables {
  checkinId: string;
  trainingId: string;
  memberNo: string;
  personalId: string;
  checkinMethod: string;
}

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

export interface SearchMemberCompaniesVariables {
  memberNo?: string | null;
  companyName?: string | null;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface SearchUncheckedTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export interface TrainingTarget_Key {
  trainingId: string;
  targetType: string;
  targetId: string;
  __typename?: 'TrainingTarget_Key';
}

export interface Training_Key {
  trainingId: string;
  __typename?: 'Training_Key';
}

interface ListTrainingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListTrainingsVariables): QueryRef<ListTrainingsData, ListTrainingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListTrainingsVariables): QueryRef<ListTrainingsData, ListTrainingsVariables>;
  operationName: string;
}
export const listTrainingsRef: ListTrainingsRef;

export function listTrainings(vars?: ListTrainingsVariables, options?: ExecuteQueryOptions): QueryPromise<ListTrainingsData, ListTrainingsVariables>;
export function listTrainings(dc: DataConnect, vars?: ListTrainingsVariables, options?: ExecuteQueryOptions): QueryPromise<ListTrainingsData, ListTrainingsVariables>;

interface SearchMemberCompaniesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SearchMemberCompaniesVariables): QueryRef<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: SearchMemberCompaniesVariables): QueryRef<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;
  operationName: string;
}
export const searchMemberCompaniesRef: SearchMemberCompaniesRef;

export function searchMemberCompanies(vars?: SearchMemberCompaniesVariables, options?: ExecuteQueryOptions): QueryPromise<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;
export function searchMemberCompanies(dc: DataConnect, vars?: SearchMemberCompaniesVariables, options?: ExecuteQueryOptions): QueryPromise<SearchMemberCompaniesData, SearchMemberCompaniesVariables>;

interface GetPersonForCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPersonForCheckinVariables): QueryRef<GetPersonForCheckinData, GetPersonForCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPersonForCheckinVariables): QueryRef<GetPersonForCheckinData, GetPersonForCheckinVariables>;
  operationName: string;
}
export const getPersonForCheckinRef: GetPersonForCheckinRef;

export function getPersonForCheckin(vars: GetPersonForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetPersonForCheckinData, GetPersonForCheckinVariables>;
export function getPersonForCheckin(dc: DataConnect, vars: GetPersonForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetPersonForCheckinData, GetPersonForCheckinVariables>;

interface RegisterPersonalCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterPersonalCheckinVariables): MutationRef<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegisterPersonalCheckinVariables): MutationRef<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;
  operationName: string;
}
export const registerPersonalCheckinRef: RegisterPersonalCheckinRef;

export function registerPersonalCheckin(vars: RegisterPersonalCheckinVariables): MutationPromise<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;
export function registerPersonalCheckin(dc: DataConnect, vars: RegisterPersonalCheckinVariables): MutationPromise<RegisterPersonalCheckinData, RegisterPersonalCheckinVariables>;

interface RegisterCompanyCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterCompanyCheckinVariables): MutationRef<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegisterCompanyCheckinVariables): MutationRef<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;
  operationName: string;
}
export const registerCompanyCheckinRef: RegisterCompanyCheckinRef;

export function registerCompanyCheckin(vars: RegisterCompanyCheckinVariables): MutationPromise<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;
export function registerCompanyCheckin(dc: DataConnect, vars: RegisterCompanyCheckinVariables): MutationPromise<RegisterCompanyCheckinData, RegisterCompanyCheckinVariables>;

interface RecentCheckinsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecentCheckinsVariables): QueryRef<RecentCheckinsData, RecentCheckinsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RecentCheckinsVariables): QueryRef<RecentCheckinsData, RecentCheckinsVariables>;
  operationName: string;
}
export const recentCheckinsRef: RecentCheckinsRef;

export function recentCheckins(vars: RecentCheckinsVariables, options?: ExecuteQueryOptions): QueryPromise<RecentCheckinsData, RecentCheckinsVariables>;
export function recentCheckins(dc: DataConnect, vars: RecentCheckinsVariables, options?: ExecuteQueryOptions): QueryPromise<RecentCheckinsData, RecentCheckinsVariables>;

interface SearchUncheckedTargetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchUncheckedTargetsVariables): QueryRef<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchUncheckedTargetsVariables): QueryRef<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;
  operationName: string;
}
export const searchUncheckedTargetsRef: SearchUncheckedTargetsRef;

export function searchUncheckedTargets(vars: SearchUncheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;
export function searchUncheckedTargets(dc: DataConnect, vars: SearchUncheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedTargetsData, SearchUncheckedTargetsVariables>;

interface GetCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCheckinVariables): QueryRef<GetCheckinData, GetCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCheckinVariables): QueryRef<GetCheckinData, GetCheckinVariables>;
  operationName: string;
}
export const getCheckinRef: GetCheckinRef;

export function getCheckin(vars: GetCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetCheckinData, GetCheckinVariables>;
export function getCheckin(dc: DataConnect, vars: GetCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetCheckinData, GetCheckinVariables>;

