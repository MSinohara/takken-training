# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listTrainings, searchMemberCompanies, getPersonForCheckin, getTrainingTargetForCheckin, registerPersonalCheckin, registerCompanyCheckin, recentCheckins, trainingCheckinSummary, trainingCheckinsByBranchDistrict, searchUncheckedTargets } from '@takken-training/sql-dataconnect';


// Operation ListTrainings:  For variables, look at type ListTrainingsVars in ../index.d.ts
const { data } = await ListTrainings(dataConnect, listTrainingsVars);

// Operation SearchMemberCompanies:  For variables, look at type SearchMemberCompaniesVars in ../index.d.ts
const { data } = await SearchMemberCompanies(dataConnect, searchMemberCompaniesVars);

// Operation GetPersonForCheckin:  For variables, look at type GetPersonForCheckinVars in ../index.d.ts
const { data } = await GetPersonForCheckin(dataConnect, getPersonForCheckinVars);

// Operation GetTrainingTargetForCheckin:  For variables, look at type GetTrainingTargetForCheckinVars in ../index.d.ts
const { data } = await GetTrainingTargetForCheckin(dataConnect, getTrainingTargetForCheckinVars);

// Operation RegisterPersonalCheckin:  For variables, look at type RegisterPersonalCheckinVars in ../index.d.ts
const { data } = await RegisterPersonalCheckin(dataConnect, registerPersonalCheckinVars);

// Operation RegisterCompanyCheckin:  For variables, look at type RegisterCompanyCheckinVars in ../index.d.ts
const { data } = await RegisterCompanyCheckin(dataConnect, registerCompanyCheckinVars);

// Operation RecentCheckins:  For variables, look at type RecentCheckinsVars in ../index.d.ts
const { data } = await RecentCheckins(dataConnect, recentCheckinsVars);

// Operation TrainingCheckinSummary:  For variables, look at type TrainingCheckinSummaryVars in ../index.d.ts
const { data } = await TrainingCheckinSummary(dataConnect, trainingCheckinSummaryVars);

// Operation TrainingCheckinsByBranchDistrict:  For variables, look at type TrainingCheckinsByBranchDistrictVars in ../index.d.ts
const { data } = await TrainingCheckinsByBranchDistrict(dataConnect, trainingCheckinsByBranchDistrictVars);

// Operation SearchUncheckedTargets:  For variables, look at type SearchUncheckedTargetsVars in ../index.d.ts
const { data } = await SearchUncheckedTargets(dataConnect, searchUncheckedTargetsVars);


```