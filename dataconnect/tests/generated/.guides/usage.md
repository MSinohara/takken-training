# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { searchMemberCompanies, getPersonForCheckin, registerPersonalCheckin, registerCompanyCheckin, recentCheckins, searchUncheckedTargets, getCheckin, upsertMemberCompany, upsertPerson, upsertTraining } from '@takken-training/sql-dataconnect';


// Operation SearchMemberCompanies:  For variables, look at type SearchMemberCompaniesVars in ../index.d.ts
const { data } = await SearchMemberCompanies(dataConnect, searchMemberCompaniesVars);

// Operation GetPersonForCheckin:  For variables, look at type GetPersonForCheckinVars in ../index.d.ts
const { data } = await GetPersonForCheckin(dataConnect, getPersonForCheckinVars);

// Operation RegisterPersonalCheckin:  For variables, look at type RegisterPersonalCheckinVars in ../index.d.ts
const { data } = await RegisterPersonalCheckin(dataConnect, registerPersonalCheckinVars);

// Operation RegisterCompanyCheckin:  For variables, look at type RegisterCompanyCheckinVars in ../index.d.ts
const { data } = await RegisterCompanyCheckin(dataConnect, registerCompanyCheckinVars);

// Operation RecentCheckins:  For variables, look at type RecentCheckinsVars in ../index.d.ts
const { data } = await RecentCheckins(dataConnect, recentCheckinsVars);

// Operation SearchUncheckedTargets:  For variables, look at type SearchUncheckedTargetsVars in ../index.d.ts
const { data } = await SearchUncheckedTargets(dataConnect, searchUncheckedTargetsVars);

// Operation GetCheckin:  For variables, look at type GetCheckinVars in ../index.d.ts
const { data } = await GetCheckin(dataConnect, getCheckinVars);

// Operation UpsertMemberCompany:  For variables, look at type UpsertMemberCompanyVars in ../index.d.ts
const { data } = await UpsertMemberCompany(dataConnect, upsertMemberCompanyVars);

// Operation UpsertPerson:  For variables, look at type UpsertPersonVars in ../index.d.ts
const { data } = await UpsertPerson(dataConnect, upsertPersonVars);

// Operation UpsertTraining:  For variables, look at type UpsertTrainingVars in ../index.d.ts
const { data } = await UpsertTraining(dataConnect, upsertTrainingVars);


```