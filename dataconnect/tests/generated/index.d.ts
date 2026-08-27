import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddPlannedAttendeeData {
  plannedAttendee_upsert: PlannedAttendee_Key;
}

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

export interface CancelCheckinData {
  checkin_update?: Checkin_Key | null;
}

export interface CancelCheckinVariables {
  checkinId: string;
  changedAt: TimestampString;
  operator?: string | null;
  reason?: string | null;
}

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
    cancelled: boolean;
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

export interface GetTrainingTargetForCheckinVariables {
  trainingId: string;
  targetType: string;
  targetId: string;
}

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

export interface ListCheckedPlannedCompanyVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface ListCheckedPlannedPersonalVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface ListCheckinHistoryVariables {
  trainingId?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface ListPlannedAttendeesVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface PlannedAttendeeSummaryVariables {
  trainingId: string;
}

export interface PlannedAttendee_Key {
  plannedId: string;
  __typename?: 'PlannedAttendee_Key';
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

export interface RemovePlannedAttendeeData {
  plannedAttendee_update?: PlannedAttendee_Key | null;
}

export interface RemovePlannedAttendeeVariables {
  plannedId: string;
  changedAt: TimestampString;
  operator?: string | null;
}

export interface RestoreCheckinData {
  checkin_update?: Checkin_Key | null;
}

export interface RestoreCheckinVariables {
  checkinId: string;
  changedAt: TimestampString;
  operator?: string | null;
  reason?: string | null;
}

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

export interface SearchCheckedCompanyTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface SearchCheckedTargetsVariables {
  trainingId: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
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

export interface SearchTrainingTargetsVariables {
  trainingId: string;
  targetType: string;
  branch?: string | null;
  district?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

export interface SearchUncheckedCompanyTargetsVariables {
  trainingId: string;
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

export interface TrainingCheckinSummaryVariables {
  trainingId: string;
  targetType: string;
  attendanceUnit: string;
}

export interface TrainingCheckinsByBranchDistrictData {
  checkins: ({
    company: {
      branch: string;
      district?: string | null;
    };
    _count: number;
  })[];
}

export interface TrainingCheckinsByBranchDistrictVariables {
  trainingId: string;
  attendanceUnit: string;
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

interface GetTrainingTargetForCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTrainingTargetForCheckinVariables): QueryRef<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTrainingTargetForCheckinVariables): QueryRef<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;
  operationName: string;
}
export const getTrainingTargetForCheckinRef: GetTrainingTargetForCheckinRef;

export function getTrainingTargetForCheckin(vars: GetTrainingTargetForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;
export function getTrainingTargetForCheckin(dc: DataConnect, vars: GetTrainingTargetForCheckinVariables, options?: ExecuteQueryOptions): QueryPromise<GetTrainingTargetForCheckinData, GetTrainingTargetForCheckinVariables>;

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

interface TrainingCheckinSummaryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TrainingCheckinSummaryVariables): QueryRef<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TrainingCheckinSummaryVariables): QueryRef<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;
  operationName: string;
}
export const trainingCheckinSummaryRef: TrainingCheckinSummaryRef;

export function trainingCheckinSummary(vars: TrainingCheckinSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;
export function trainingCheckinSummary(dc: DataConnect, vars: TrainingCheckinSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinSummaryData, TrainingCheckinSummaryVariables>;

interface SearchTrainingTargetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchTrainingTargetsVariables): QueryRef<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchTrainingTargetsVariables): QueryRef<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;
  operationName: string;
}
export const searchTrainingTargetsRef: SearchTrainingTargetsRef;

export function searchTrainingTargets(vars: SearchTrainingTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;
export function searchTrainingTargets(dc: DataConnect, vars: SearchTrainingTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchTrainingTargetsData, SearchTrainingTargetsVariables>;

interface SearchCheckedTargetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchCheckedTargetsVariables): QueryRef<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchCheckedTargetsVariables): QueryRef<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;
  operationName: string;
}
export const searchCheckedTargetsRef: SearchCheckedTargetsRef;

export function searchCheckedTargets(vars: SearchCheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;
export function searchCheckedTargets(dc: DataConnect, vars: SearchCheckedTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedTargetsData, SearchCheckedTargetsVariables>;

interface SearchCheckedCompanyTargetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchCheckedCompanyTargetsVariables): QueryRef<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchCheckedCompanyTargetsVariables): QueryRef<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;
  operationName: string;
}
export const searchCheckedCompanyTargetsRef: SearchCheckedCompanyTargetsRef;

export function searchCheckedCompanyTargets(vars: SearchCheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;
export function searchCheckedCompanyTargets(dc: DataConnect, vars: SearchCheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchCheckedCompanyTargetsData, SearchCheckedCompanyTargetsVariables>;

interface TrainingCheckinsByBranchDistrictRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TrainingCheckinsByBranchDistrictVariables): QueryRef<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TrainingCheckinsByBranchDistrictVariables): QueryRef<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;
  operationName: string;
}
export const trainingCheckinsByBranchDistrictRef: TrainingCheckinsByBranchDistrictRef;

export function trainingCheckinsByBranchDistrict(vars: TrainingCheckinsByBranchDistrictVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;
export function trainingCheckinsByBranchDistrict(dc: DataConnect, vars: TrainingCheckinsByBranchDistrictVariables, options?: ExecuteQueryOptions): QueryPromise<TrainingCheckinsByBranchDistrictData, TrainingCheckinsByBranchDistrictVariables>;

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

interface SearchUncheckedCompanyTargetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchUncheckedCompanyTargetsVariables): QueryRef<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchUncheckedCompanyTargetsVariables): QueryRef<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;
  operationName: string;
}
export const searchUncheckedCompanyTargetsRef: SearchUncheckedCompanyTargetsRef;

export function searchUncheckedCompanyTargets(vars: SearchUncheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;
export function searchUncheckedCompanyTargets(dc: DataConnect, vars: SearchUncheckedCompanyTargetsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchUncheckedCompanyTargetsData, SearchUncheckedCompanyTargetsVariables>;

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

interface ListCheckinHistoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCheckinHistoryVariables): QueryRef<ListCheckinHistoryData, ListCheckinHistoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListCheckinHistoryVariables): QueryRef<ListCheckinHistoryData, ListCheckinHistoryVariables>;
  operationName: string;
}
export const listCheckinHistoryRef: ListCheckinHistoryRef;

export function listCheckinHistory(vars?: ListCheckinHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckinHistoryData, ListCheckinHistoryVariables>;
export function listCheckinHistory(dc: DataConnect, vars?: ListCheckinHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckinHistoryData, ListCheckinHistoryVariables>;

interface CancelCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelCheckinVariables): MutationRef<CancelCheckinData, CancelCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CancelCheckinVariables): MutationRef<CancelCheckinData, CancelCheckinVariables>;
  operationName: string;
}
export const cancelCheckinRef: CancelCheckinRef;

export function cancelCheckin(vars: CancelCheckinVariables): MutationPromise<CancelCheckinData, CancelCheckinVariables>;
export function cancelCheckin(dc: DataConnect, vars: CancelCheckinVariables): MutationPromise<CancelCheckinData, CancelCheckinVariables>;

interface RestoreCheckinRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreCheckinVariables): MutationRef<RestoreCheckinData, RestoreCheckinVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RestoreCheckinVariables): MutationRef<RestoreCheckinData, RestoreCheckinVariables>;
  operationName: string;
}
export const restoreCheckinRef: RestoreCheckinRef;

export function restoreCheckin(vars: RestoreCheckinVariables): MutationPromise<RestoreCheckinData, RestoreCheckinVariables>;
export function restoreCheckin(dc: DataConnect, vars: RestoreCheckinVariables): MutationPromise<RestoreCheckinData, RestoreCheckinVariables>;

interface ListPlannedAttendeesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListPlannedAttendeesVariables): QueryRef<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListPlannedAttendeesVariables): QueryRef<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;
  operationName: string;
}
export const listPlannedAttendeesRef: ListPlannedAttendeesRef;

export function listPlannedAttendees(vars: ListPlannedAttendeesVariables, options?: ExecuteQueryOptions): QueryPromise<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;
export function listPlannedAttendees(dc: DataConnect, vars: ListPlannedAttendeesVariables, options?: ExecuteQueryOptions): QueryPromise<ListPlannedAttendeesData, ListPlannedAttendeesVariables>;

interface PlannedAttendeeSummaryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlannedAttendeeSummaryVariables): QueryRef<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PlannedAttendeeSummaryVariables): QueryRef<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;
  operationName: string;
}
export const plannedAttendeeSummaryRef: PlannedAttendeeSummaryRef;

export function plannedAttendeeSummary(vars: PlannedAttendeeSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;
export function plannedAttendeeSummary(dc: DataConnect, vars: PlannedAttendeeSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<PlannedAttendeeSummaryData, PlannedAttendeeSummaryVariables>;

interface ListCheckedPlannedPersonalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCheckedPlannedPersonalVariables): QueryRef<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCheckedPlannedPersonalVariables): QueryRef<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;
  operationName: string;
}
export const listCheckedPlannedPersonalRef: ListCheckedPlannedPersonalRef;

export function listCheckedPlannedPersonal(vars: ListCheckedPlannedPersonalVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;
export function listCheckedPlannedPersonal(dc: DataConnect, vars: ListCheckedPlannedPersonalVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedPersonalData, ListCheckedPlannedPersonalVariables>;

interface ListCheckedPlannedCompanyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCheckedPlannedCompanyVariables): QueryRef<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCheckedPlannedCompanyVariables): QueryRef<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;
  operationName: string;
}
export const listCheckedPlannedCompanyRef: ListCheckedPlannedCompanyRef;

export function listCheckedPlannedCompany(vars: ListCheckedPlannedCompanyVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;
export function listCheckedPlannedCompany(dc: DataConnect, vars: ListCheckedPlannedCompanyVariables, options?: ExecuteQueryOptions): QueryPromise<ListCheckedPlannedCompanyData, ListCheckedPlannedCompanyVariables>;

interface AddPlannedAttendeeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddPlannedAttendeeVariables): MutationRef<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddPlannedAttendeeVariables): MutationRef<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;
  operationName: string;
}
export const addPlannedAttendeeRef: AddPlannedAttendeeRef;

export function addPlannedAttendee(vars: AddPlannedAttendeeVariables): MutationPromise<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;
export function addPlannedAttendee(dc: DataConnect, vars: AddPlannedAttendeeVariables): MutationPromise<AddPlannedAttendeeData, AddPlannedAttendeeVariables>;

interface RemovePlannedAttendeeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemovePlannedAttendeeVariables): MutationRef<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemovePlannedAttendeeVariables): MutationRef<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;
  operationName: string;
}
export const removePlannedAttendeeRef: RemovePlannedAttendeeRef;

export function removePlannedAttendee(vars: RemovePlannedAttendeeVariables): MutationPromise<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;
export function removePlannedAttendee(dc: DataConnect, vars: RemovePlannedAttendeeVariables): MutationPromise<RemovePlannedAttendeeData, RemovePlannedAttendeeVariables>;

