const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'takken-training',
  location: 'asia-northeast1'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const listTrainingsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTrainings', inputVars);
}
listTrainingsRef.operationName = 'ListTrainings';
exports.listTrainingsRef = listTrainingsRef;

exports.listTrainings = function listTrainings(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listTrainingsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchMemberCompaniesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchMemberCompanies', inputVars);
}
searchMemberCompaniesRef.operationName = 'SearchMemberCompanies';
exports.searchMemberCompaniesRef = searchMemberCompaniesRef;

exports.searchMemberCompanies = function searchMemberCompanies(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(searchMemberCompaniesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getPersonForCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPersonForCheckin', inputVars);
}
getPersonForCheckinRef.operationName = 'GetPersonForCheckin';
exports.getPersonForCheckinRef = getPersonForCheckinRef;

exports.getPersonForCheckin = function getPersonForCheckin(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPersonForCheckinRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchPeopleForCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchPeopleForCheckin', inputVars);
}
searchPeopleForCheckinRef.operationName = 'SearchPeopleForCheckin';
exports.searchPeopleForCheckinRef = searchPeopleForCheckinRef;

exports.searchPeopleForCheckin = function searchPeopleForCheckin(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(searchPeopleForCheckinRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getTrainingTargetForCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTrainingTargetForCheckin', inputVars);
}
getTrainingTargetForCheckinRef.operationName = 'GetTrainingTargetForCheckin';
exports.getTrainingTargetForCheckinRef = getTrainingTargetForCheckinRef;

exports.getTrainingTargetForCheckin = function getTrainingTargetForCheckin(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getTrainingTargetForCheckinRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const registerPersonalCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterPersonalCheckin', inputVars);
}
registerPersonalCheckinRef.operationName = 'RegisterPersonalCheckin';
exports.registerPersonalCheckinRef = registerPersonalCheckinRef;

exports.registerPersonalCheckin = function registerPersonalCheckin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerPersonalCheckinRef(dcInstance, inputVars));
}
;

const registerNewPersonalCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterNewPersonalCheckin', inputVars);
}
registerNewPersonalCheckinRef.operationName = 'RegisterNewPersonalCheckin';
exports.registerNewPersonalCheckinRef = registerNewPersonalCheckinRef;

exports.registerNewPersonalCheckin = function registerNewPersonalCheckin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerNewPersonalCheckinRef(dcInstance, inputVars));
}
;

const registerCompanyCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterCompanyCheckin', inputVars);
}
registerCompanyCheckinRef.operationName = 'RegisterCompanyCheckin';
exports.registerCompanyCheckinRef = registerCompanyCheckinRef;

exports.registerCompanyCheckin = function registerCompanyCheckin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerCompanyCheckinRef(dcInstance, inputVars));
}
;

const registerGuestCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterGuestCheckin', inputVars);
}
registerGuestCheckinRef.operationName = 'RegisterGuestCheckin';
exports.registerGuestCheckinRef = registerGuestCheckinRef;

exports.registerGuestCheckin = function registerGuestCheckin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerGuestCheckinRef(dcInstance, inputVars));
}
;

const recentGuestCheckinsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'RecentGuestCheckins', inputVars);
}
recentGuestCheckinsRef.operationName = 'RecentGuestCheckins';
exports.recentGuestCheckinsRef = recentGuestCheckinsRef;

exports.recentGuestCheckins = function recentGuestCheckins(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(recentGuestCheckinsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const guestCheckinSummaryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GuestCheckinSummary', inputVars);
}
guestCheckinSummaryRef.operationName = 'GuestCheckinSummary';
exports.guestCheckinSummaryRef = guestCheckinSummaryRef;

exports.guestCheckinSummary = function guestCheckinSummary(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(guestCheckinSummaryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const recentCheckinsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'RecentCheckins', inputVars);
}
recentCheckinsRef.operationName = 'RecentCheckins';
exports.recentCheckinsRef = recentCheckinsRef;

exports.recentCheckins = function recentCheckins(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(recentCheckinsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const trainingCheckinSummaryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TrainingCheckinSummary', inputVars);
}
trainingCheckinSummaryRef.operationName = 'TrainingCheckinSummary';
exports.trainingCheckinSummaryRef = trainingCheckinSummaryRef;

exports.trainingCheckinSummary = function trainingCheckinSummary(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(trainingCheckinSummaryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchTrainingTargetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchTrainingTargets', inputVars);
}
searchTrainingTargetsRef.operationName = 'SearchTrainingTargets';
exports.searchTrainingTargetsRef = searchTrainingTargetsRef;

exports.searchTrainingTargets = function searchTrainingTargets(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchTrainingTargetsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchCheckedTargetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchCheckedTargets', inputVars);
}
searchCheckedTargetsRef.operationName = 'SearchCheckedTargets';
exports.searchCheckedTargetsRef = searchCheckedTargetsRef;

exports.searchCheckedTargets = function searchCheckedTargets(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchCheckedTargetsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchCheckedCompanyTargetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchCheckedCompanyTargets', inputVars);
}
searchCheckedCompanyTargetsRef.operationName = 'SearchCheckedCompanyTargets';
exports.searchCheckedCompanyTargetsRef = searchCheckedCompanyTargetsRef;

exports.searchCheckedCompanyTargets = function searchCheckedCompanyTargets(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchCheckedCompanyTargetsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const trainingCheckinsByBranchDistrictRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TrainingCheckinsByBranchDistrict', inputVars);
}
trainingCheckinsByBranchDistrictRef.operationName = 'TrainingCheckinsByBranchDistrict';
exports.trainingCheckinsByBranchDistrictRef = trainingCheckinsByBranchDistrictRef;

exports.trainingCheckinsByBranchDistrict = function trainingCheckinsByBranchDistrict(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(trainingCheckinsByBranchDistrictRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchUncheckedTargetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchUncheckedTargets', inputVars);
}
searchUncheckedTargetsRef.operationName = 'SearchUncheckedTargets';
exports.searchUncheckedTargetsRef = searchUncheckedTargetsRef;

exports.searchUncheckedTargets = function searchUncheckedTargets(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchUncheckedTargetsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchUncheckedCompanyTargetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchUncheckedCompanyTargets', inputVars);
}
searchUncheckedCompanyTargetsRef.operationName = 'SearchUncheckedCompanyTargets';
exports.searchUncheckedCompanyTargetsRef = searchUncheckedCompanyTargetsRef;

exports.searchUncheckedCompanyTargets = function searchUncheckedCompanyTargets(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchUncheckedCompanyTargetsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCheckin', inputVars);
}
getCheckinRef.operationName = 'GetCheckin';
exports.getCheckinRef = getCheckinRef;

exports.getCheckin = function getCheckin(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getCheckinRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCheckinHistoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCheckinHistory', inputVars);
}
listCheckinHistoryRef.operationName = 'ListCheckinHistory';
exports.listCheckinHistoryRef = listCheckinHistoryRef;

exports.listCheckinHistory = function listCheckinHistory(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listCheckinHistoryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const cancelCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CancelCheckin', inputVars);
}
cancelCheckinRef.operationName = 'CancelCheckin';
exports.cancelCheckinRef = cancelCheckinRef;

exports.cancelCheckin = function cancelCheckin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(cancelCheckinRef(dcInstance, inputVars));
}
;

const restoreCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RestoreCheckin', inputVars);
}
restoreCheckinRef.operationName = 'RestoreCheckin';
exports.restoreCheckinRef = restoreCheckinRef;

exports.restoreCheckin = function restoreCheckin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(restoreCheckinRef(dcInstance, inputVars));
}
;

const restoreCancelledCheckinPublicRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RestoreCancelledCheckinPublic', inputVars);
}
restoreCancelledCheckinPublicRef.operationName = 'RestoreCancelledCheckinPublic';
exports.restoreCancelledCheckinPublicRef = restoreCancelledCheckinPublicRef;

exports.restoreCancelledCheckinPublic = function restoreCancelledCheckinPublic(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(restoreCancelledCheckinPublicRef(dcInstance, inputVars));
}
;

const getPlannedAttendeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPlannedAttendee', inputVars);
}
getPlannedAttendeeRef.operationName = 'GetPlannedAttendee';
exports.getPlannedAttendeeRef = getPlannedAttendeeRef;

exports.getPlannedAttendee = function getPlannedAttendee(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPlannedAttendeeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getPlannedAttendeeForCheckinRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPlannedAttendeeForCheckin', inputVars);
}
getPlannedAttendeeForCheckinRef.operationName = 'GetPlannedAttendeeForCheckin';
exports.getPlannedAttendeeForCheckinRef = getPlannedAttendeeForCheckinRef;

exports.getPlannedAttendeeForCheckin = function getPlannedAttendeeForCheckin(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPlannedAttendeeForCheckinRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPlannedAttendeesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPlannedAttendees', inputVars);
}
listPlannedAttendeesRef.operationName = 'ListPlannedAttendees';
exports.listPlannedAttendeesRef = listPlannedAttendeesRef;

exports.listPlannedAttendees = function listPlannedAttendees(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listPlannedAttendeesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const plannedAttendeeSummaryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlannedAttendeeSummary', inputVars);
}
plannedAttendeeSummaryRef.operationName = 'PlannedAttendeeSummary';
exports.plannedAttendeeSummaryRef = plannedAttendeeSummaryRef;

exports.plannedAttendeeSummary = function plannedAttendeeSummary(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(plannedAttendeeSummaryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCheckedPlannedPersonalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCheckedPlannedPersonal', inputVars);
}
listCheckedPlannedPersonalRef.operationName = 'ListCheckedPlannedPersonal';
exports.listCheckedPlannedPersonalRef = listCheckedPlannedPersonalRef;

exports.listCheckedPlannedPersonal = function listCheckedPlannedPersonal(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCheckedPlannedPersonalRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCheckedPlannedCompanyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCheckedPlannedCompany', inputVars);
}
listCheckedPlannedCompanyRef.operationName = 'ListCheckedPlannedCompany';
exports.listCheckedPlannedCompanyRef = listCheckedPlannedCompanyRef;

exports.listCheckedPlannedCompany = function listCheckedPlannedCompany(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCheckedPlannedCompanyRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const addPlannedAttendeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddPlannedAttendee', inputVars);
}
addPlannedAttendeeRef.operationName = 'AddPlannedAttendee';
exports.addPlannedAttendeeRef = addPlannedAttendeeRef;

exports.addPlannedAttendee = function addPlannedAttendee(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(addPlannedAttendeeRef(dcInstance, inputVars));
}
;

const removePlannedAttendeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemovePlannedAttendee', inputVars);
}
removePlannedAttendeeRef.operationName = 'RemovePlannedAttendee';
exports.removePlannedAttendeeRef = removePlannedAttendeeRef;

exports.removePlannedAttendee = function removePlannedAttendee(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removePlannedAttendeeRef(dcInstance, inputVars));
}
;
