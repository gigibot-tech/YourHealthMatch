import { mountShell, stubPage } from '../shell.js';

export function mountDoctorStub(root, path, title) {
  mountShell(root, {
    role: 'doctor',
    activePath: path,
    contentHtml: stubPage(title),
  });
}
