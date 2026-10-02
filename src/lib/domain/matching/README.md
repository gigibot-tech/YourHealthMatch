/**
 * Matching field glossary
 *
 * Patient demand ↔ practice/doctor supply for the Phase-1 rule engine.
 * All five parameters are hard filters. Results are capped at MATCH_RESULT_MAX doctors.
 *
 * | # | Parameter | Patient | Supply | Rule |
 * |---|-----------|---------|--------|------|
 * | 1 | Language | code UK/AR/TR/RU/EN/DE | Practice languages | Must speak |
 * | 2 | Specialty | Specialty needed | Doctor specialty | Must match that doctor |
 * | 3 | Insurance | GKV / PKV / Selbstzahler | Accepted + kvApproved | GKV needs KV-Zulassung |
 * | 4 | Availability | — | Published bookable slot | Doctor must have a next slot |
 * | 5 | Proximity | City / PLZ | Practice location | Required for in_person only |
 *
 * Extra: newPatient → practice.acceptingNewPatients when patient is new.
 */

export {};
