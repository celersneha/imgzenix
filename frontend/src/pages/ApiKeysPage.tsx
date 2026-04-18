import {
  Copy,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, useApiKeysPage } from "@/hooks/useApiKeysPage";

export default function ApiKeysPage() {
  const {
    keys,
    isLoading,
    isSubmitting,
    error,
    latestKey,
    hasActiveKeys,
    newKeyName,
    expiryDays,
    createDialogOpen,
    setNewKeyName,
    setExpiryDays,
    handleCreate,
    handleRevoke,
    handleCopyLatestKey,
    hideLatestKey,
    handleCreateDialogChange,
  } = useApiKeysPage();

  return (
    <section className="space-y-6">
      <header className="panel-surface overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="soft-badge">MCP and automation access</div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              API Keys
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Create per-user API keys for Claude Desktop MCP. Keys are scoped
              to your account data only.
            </p>
          </div>

          <Dialog
            open={createDialogOpen}
            onOpenChange={handleCreateDialogChange}
          >
            <DialogTrigger asChild>
              <Button type="button">
                <KeyRound className="size-4" />
                Create API key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  This key will be shown once. Store it in your Claude MCP
                  config.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <label className="block space-y-2 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
                    onChange={(event) => setNewKeyName(event.target.value)}
                    placeholder="Claude Desktop - Personal"
                    value={newKeyName}
                  />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="text-muted-foreground">
                    Expires in (days)
                  </span>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
                    min={0}
                    onChange={(event) =>
                      setExpiryDays(Number(event.target.value) || 0)
                    }
                    type="number"
                    value={expiryDays}
                  />
                </label>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  type="button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create key"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {latestKey ? (
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
          <p className="text-sm font-medium text-foreground">
            New API key (shown once)
          </p>
          <p className="mt-2 break-all rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground">
            {latestKey}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleCopyLatestKey}
              type="button"
              variant="outline"
            >
              <Copy className="size-4" />
              Copy key
            </Button>
            <Button onClick={hideLatestKey} type="button" variant="ghost">
              Hide key
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel-surface flex min-h-52 items-center justify-center gap-3 p-8 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          Loading API keys...
        </div>
      ) : (
        <div className="space-y-3">
          {!hasActiveKeys ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No active keys yet. Create one to connect Claude Desktop MCP.
            </div>
          ) : null}

          {keys.map((item) => (
            <article
              key={item._id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prefix: {item.keyPrefix} • Created:{" "}
                    {formatDate(item.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last used: {formatDate(item.lastUsedAt)} • Expires:{" "}
                    {formatDate(item.expiresAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.scopes.map((scope) => (
                      <span
                        key={`${item._id}-${scope}`}
                        className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {item.revokedAt ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4" />
                    Revoked
                  </div>
                ) : (
                  <Button
                    onClick={() => void handleRevoke(item._id)}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    Revoke
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
