function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function createSupabaseStateStore(options = {}) {
  const supabaseUrl = trimTrailingSlash(options.supabaseUrl);
  const serviceRoleKey = String(options.serviceRoleKey || "");
  const table = String(options.table || "cluster_state_snapshots").trim() || "cluster_state_snapshots";
  const instanceKey = String(options.instanceKey || "campuscloud-dev").trim() || "campuscloud-dev";
  const enabled = Boolean(supabaseUrl && serviceRoleKey);

  function getHeaders(extra = {}) {
    return {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  async function loadLatestSnapshot() {
    if (!enabled) {
      return null;
    }

    const url =
      `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}` +
      `?select=snapshot,updated_at&instance_key=eq.${encodeURIComponent(instanceKey)}&limit=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Supabase snapshot load failed: ${response.status} ${response.statusText}`);
    }

    const rows = await response.json();
    return rows[0]?.snapshot || null;
  }

  async function saveSnapshot(snapshot) {
    if (!enabled) {
      return false;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: getHeaders({
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify([
        {
          instance_key: instanceKey,
          snapshot,
          updated_at: new Date().toISOString(),
        },
      ]),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Supabase snapshot save failed: ${response.status} ${response.statusText}${detail ? `: ${detail}` : ""}`
      );
    }

    return true;
  }

  return {
    enabled,
    instanceKey,
    table,
    loadLatestSnapshot,
    saveSnapshot,
  };
}

module.exports = {
  createSupabaseStateStore,
};
