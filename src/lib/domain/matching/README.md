# Matching field glossary

Patient demand ↔ practice supply fields that drive `matchingEngine`.

| Field | Patient | Practice | Notes |
|-------|---------|----------|-------|
| language | Preferred language | Languages spoken | Hard filter |
| specialty | Specialty needed | Specialties offered | Hard filter; GP, dentist, dermatology first-class |
| insurance | GKV / PKV / private | Insurance accepted | Hard filter |
| location / city | City / area | Location | Soft score |
| postcode | PLZ (survey Q10h) | Practice PLZ | Pilot distance / exact match boost |
| newPatient | New patient? | Accepting new patients | Hard filter when true |
| preferredWindow | Timeframe | Availability / weeklyHours | Soft via same-week slots |
| modality | in_person / video / either | Modalities offered | Soft |
| krankenkasse | TK, DAK, … (Q6) | — | Optional boost later |

Weights live in `matchDefaults.ts` (`MATCH_WEIGHTS`).
