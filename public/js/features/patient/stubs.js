import { mountShell, stubPage } from '../shell.js';

export function mountPatientStub(root, path, title) {
  mountShell(root, {
    role: 'patient',
    activePath: path,
    contentHtml: stubPage(title),
  });
}
