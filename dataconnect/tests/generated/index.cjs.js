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
