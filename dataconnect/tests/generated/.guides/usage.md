# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listTrainings, saveTraining, searchMemberCompanies, getPersonForCheckin, searchPeopleForCheckin, getTrainingTargetForCheckin, registerPersonalCheckin, registerNewPersonalCheckin, registerCompanyCheckin, registerGuestCheckin } from '@takken-training/sql-dataconnect';


// Operation ListTrainings:  For variables, look at type ListTrainingsVars in ../index.d.ts
const { data } = await ListTrainings(dataConnect, listTrainingsVars);

// Operation SaveTraining:  For variables, look at type SaveTrainingVars in ../index.d.ts
const { data } = await SaveTraining(dataConnect, saveTrainingVars);

// Operation SearchMemberCompanies:  For variables, look at type SearchMemberCompaniesVars in ../index.d.ts
const { data } = await SearchMemberCompanies(dataConnect, searchMemberCompaniesVars);

// Operation GetPersonForCheckin:  For variables, look at type GetPersonForCheckinVars in ../index.d.ts
const { data } = await GetPersonForCheckin(dataConnect, getPersonForCheckinVars);

// Operation SearchPeopleForCheckin:  For variables, look at type SearchPeopleForCheckinVars in ../index.d.ts
const { data } = await SearchPeopleForCheckin(dataConnect, searchPeopleForCheckinVars);

// Operation GetTrainingTargetForCheckin:  For variables, look at type GetTrainingTargetForCheckinVars in ../index.d.ts
const { data } = await GetTrainingTargetForCheckin(dataConnect, getTrainingTargetForCheckinVars);

// Operation RegisterPersonalCheckin:  For variables, look at type RegisterPersonalCheckinVars in ../index.d.ts
const { data } = await RegisterPersonalCheckin(dataConnect, registerPersonalCheckinVars);

// Operation RegisterNewPersonalCheckin:  For variables, look at type RegisterNewPersonalCheckinVars in ../index.d.ts
const { data } = await RegisterNewPersonalCheckin(dataConnect, registerNewPersonalCheckinVars);

// Operation RegisterCompanyCheckin:  For variables, look at type RegisterCompanyCheckinVars in ../index.d.ts
const { data } = await RegisterCompanyCheckin(dataConnect, registerCompanyCheckinVars);

// Operation RegisterGuestCheckin:  For variables, look at type RegisterGuestCheckinVars in ../index.d.ts
const { data } = await RegisterGuestCheckin(dataConnect, registerGuestCheckinVars);


```