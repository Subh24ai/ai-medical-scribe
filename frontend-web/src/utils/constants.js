import { LANGUAGES, BLOOD_GROUPS, DOSAGE_FREQUENCIES } from '../utils';

<select>
  {LANGUAGES.map(lang => (
    <option value={lang.code}>{lang.name}</option>
  ))}
</select>