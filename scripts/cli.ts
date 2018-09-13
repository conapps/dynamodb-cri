import { createTable } from './createTable';
import { deleteTable } from './deleteTable';
import { count } from './count';
import { aps, apsByLocationId, apsWithLicence } from './aps';
import { licences, licencesWithAp } from './licences';
import { joinAPsWithLicences } from './joinAPsWithLicences';
import { wait } from './wait';
import { scan } from './scan';
import { query } from './query';
import { deleteAp } from './deleteAp';

var action = process.argv[2];

main();

async function main() {
  try {
    switch (action) {
      case 'createTable':
        await createTable();
        break;
      case 'deleteTable':
        await deleteTable();
        break;
      case 'deleteAp':
        await deleteAp(process.argv[3], process.argv[4]);
        break;
      case 'reset':
        await deleteTable();
        await wait(1000);
        await createTable();
        break;
      case 'count':
        await count();
        break;
      case 'licences':
        await licences();
        break;
      case 'licencesWithAp':
        await licencesWithAp();
        break;
      case 'aps':
        await aps();
        break;
      case 'apsByLocationId':
        await apsByLocationId(process.argv[3]);
        break;
      case 'apsWithLicence':
        await apsWithLicence();
        break;
      case 'joinAPsWithLicences':
        await joinAPsWithLicences();
        break;
      case 'scan':
        await scan(JSON.parse(process.argv[3]));
        break;
      case 'query':
        await query(JSON.parse(process.argv[3]));
        break;
      default:
        console.log(`No action found for ${action}`);
    }
  } catch (err) {
    console.log(err);
  }

  console.log('Done');
}
