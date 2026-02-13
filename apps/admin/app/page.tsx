import { listTenantSnapshotsForAdmin } from '@real-estate/db/control-plane';

import { ControlPlaneWorkspace } from './components/control-plane-workspace';

export default async function HomePage() {
  const snapshots = await listTenantSnapshotsForAdmin();
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main>
      <ControlPlaneWorkspace initialSnapshots={snapshots} hasClerkKey={hasClerkKey} />
    </main>
  );
}
