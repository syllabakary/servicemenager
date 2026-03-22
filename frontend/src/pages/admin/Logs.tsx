import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FaClipboardList, FaFilter, FaTimes, FaSearch,
  FaPlus, FaEdit, FaTrash, FaEnvelope, FaFilePdf,
  FaSignInAlt, FaSignOutAlt, FaEllipsisH, FaSyncAlt,
  FaExclamationCircle, FaChevronDown, FaChevronRight,
  FaUser, FaCode,
} from "react-icons/fa";
import axios from "axios";
import { useState } from "react";
import { API_URL } from "@/config/api";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

// ── Config action ────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; icon: any; badgeClass: string }> = {
  CREATE:  { label: "Création",     icon: FaPlus,              badgeClass: "bg-green-50 text-green-700 border border-green-200" },
  UPDATE:  { label: "Modification", icon: FaEdit,              badgeClass: "bg-blue-50 text-blue-700 border border-blue-200" },
  DELETE:  { label: "Suppression",  icon: FaTrash,             badgeClass: "bg-red-50 text-red-700 border border-red-200" },
  LOGIN:   { label: "Connexion",    icon: FaSignInAlt,         badgeClass: "bg-purple-50 text-purple-700 border border-purple-200" },
  LOGOUT:  { label: "Déconnexion",  icon: FaSignOutAlt,        badgeClass: "bg-gray-50 text-gray-600 border border-gray-200" },
  EMAIL:   { label: "Email envoyé", icon: FaEnvelope,          badgeClass: "bg-sky-50 text-sky-700 border border-sky-200" },
  PDF:     { label: "PDF généré",   icon: FaFilePdf,           badgeClass: "bg-orange-50 text-orange-700 border border-orange-200" },
  ERROR:   { label: "Erreur",       icon: FaExclamationCircle, badgeClass: "bg-red-100 text-red-800 border border-red-400" },
  OTHER:   { label: "Autre",        icon: FaEllipsisH,         badgeClass: "bg-gray-50 text-gray-500 border border-gray-200" },
};

// ── Config niveau ────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<string, { cls: string; dot: string }> = {
  DEBUG:    { cls: "text-gray-400",  dot: "bg-gray-300" },
  INFO:     { cls: "text-blue-600",  dot: "bg-blue-400" },
  WARNING:  { cls: "text-amber-600", dot: "bg-amber-400" },
  ERROR:    { cls: "text-red-600",   dot: "bg-red-500" },
  CRITICAL: { cls: "text-red-800 font-bold", dot: "bg-red-700" },
};

// ── Composants badge ─────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.OTHER;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.badgeClass}`}>
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.INFO;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {level}
    </span>
  );
}

// ── Ligne de log dépliable ───────────────────────────────────────────────────
function LogRow({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(log.created_at);
  const dateStr = date.toLocaleDateString("fr-FR");
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const isError = log.action === "ERROR" || log.level === "ERROR" || log.level === "CRITICAL";
  const hasDetail = log.detail && log.detail.trim().length > 0;
  const hasExtra = log.extra && Object.keys(log.extra).length > 0;

  return (
    <>
      <tr
        className={`border-b border-gray-100 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${isError ? "bg-red-50/30 hover:bg-red-50/50" : ""}`}
        onClick={() => (hasDetail || hasExtra) && setExpanded(!expanded)}
      >
        {/* Date/heure */}
        <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap w-32">
          <div className="font-medium text-gray-700">{dateStr}</div>
          <div className="text-gray-400">{timeStr}</div>
        </td>
        {/* Niveau */}
        <td className="px-3 py-2 w-24">
          <LevelBadge level={log.level || "INFO"} />
        </td>
        {/* Action */}
        <td className="px-3 py-2 w-32">
          <ActionBadge action={log.action} />
        </td>
        {/* Utilisateur */}
        <td className="px-3 py-2 w-32">
          <span className={`flex items-center gap-1 text-xs ${log.username && log.username !== "Anonyme" ? "text-site-primary font-medium" : "text-gray-400 italic"}`}>
            <FaUser className="w-2.5 h-2.5" />
            {log.username || "Anonyme"}
          </span>
        </td>
        {/* Logger/Modèle */}
        <td className="px-3 py-2 w-36">
          <div className="text-xs text-gray-600 font-medium truncate max-w-[130px]" title={log.model_name}>{log.model_name || "—"}</div>
          {log.logger_name && (
            <div className="text-xs text-gray-400 font-mono truncate max-w-[130px]" title={log.logger_name}>
              <FaCode className="inline w-2.5 h-2.5 mr-0.5" />{log.logger_name}
            </div>
          )}
        </td>
        {/* Message */}
        <td className="px-3 py-2">
          <div className={`text-xs truncate max-w-xs ${isError ? "text-red-700 font-medium" : "text-gray-700"}`} title={log.object_repr}>
            {log.object_repr || "—"}
          </div>
          {log.extra?.funcName && log.extra?.lineno && (
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              {log.extra.module}.{log.extra.funcName}:{log.extra.lineno}
            </div>
          )}
        </td>
        {/* IP */}
        <td className="px-3 py-2 w-28 font-mono text-xs text-gray-400 whitespace-nowrap">
          {log.ip_address || "—"}
        </td>
        {/* Expand icon */}
        <td className="px-2 py-2 w-6 text-gray-300">
          {(hasDetail || hasExtra) && (
            expanded
              ? <FaChevronDown className="w-3 h-3" />
              : <FaChevronRight className="w-3 h-3" />
          )}
        </td>
      </tr>

      {/* Détail dépliable */}
      {expanded && (hasDetail || hasExtra) && (
        <tr className={`border-b border-gray-100 ${isError ? "bg-red-50/40" : "bg-gray-50/60"}`}>
          <td colSpan={8} className="px-4 py-3">
            <div className="space-y-3">
              {/* Message complet */}
              {hasDetail && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Détail / Traceback
                  </div>
                  <pre className={`text-xs rounded-lg p-3 whitespace-pre-wrap break-all max-h-72 overflow-auto font-mono leading-relaxed
                    ${isError ? "bg-red-950 text-red-100 border border-red-800" : "bg-gray-900 text-green-300 border border-gray-700"}`}>
                    {log.detail}
                  </pre>
                </div>
              )}

              {/* Extra data */}
              {hasExtra && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Contexte
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(log.extra).map(([k, v]: [string, any]) => (
                      <div key={k} className="bg-white border border-gray-200 rounded px-2 py-1">
                        <div className="text-xs text-gray-400 font-mono">{k}</div>
                        <div className="text-xs text-gray-700 font-medium truncate" title={String(v)}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function Logs() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "", action: "", model_name: "", level: "", date_from: "", date_to: "",
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const buildParams = () => {
    const p: Record<string, string> = { page: String(page), page_size: String(PAGE_SIZE) };
    if (filters.search)     p.search     = filters.search;
    if (filters.action)     p.action     = filters.action;
    if (filters.model_name) p.model_name = filters.model_name;
    if (filters.date_from)  p.date_from  = filters.date_from;
    if (filters.date_to)    p.date_to    = filters.date_to;
    return new URLSearchParams(p).toString();
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity-logs", filters, page],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/activity-logs/?${buildParams()}`, {
        headers: authHeader(),
      });
      return res.data;
    },
    refetchInterval: 30000,
  });

  const allLogs: any[] = data?.results || data || [];
  const total = data?.count || allLogs.length;

  // Filtre level côté client (pas exposé en filterset Django)
  const logs = filters.level
    ? allLogs.filter((l: any) => l.level === filters.level)
    : allLogs;

  const resetFilters = () => {
    setFilters({ search: "", action: "", model_name: "", level: "", date_from: "", date_to: "" });
    setPage(1);
  };

  const stats = {
    total: logs.length,
    errors:   logs.filter((l: any) => l.level === "ERROR" || l.level === "CRITICAL").length,
    warnings: logs.filter((l: any) => l.level === "WARNING").length,
    infos:    logs.filter((l: any) => l.level === "INFO").length,
    creates:  logs.filter((l: any) => l.action === "CREATE").length,
    logins:   logs.filter((l: any) => l.action === "LOGIN").length,
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4">

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaClipboardList className="text-site-primary" /> Journal d'activité
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Logs détaillés — cliquez sur une ligne pour voir le détail complet
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}
                className="flex items-center gap-2 text-sm h-9">
                <FaSyncAlt className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm h-9">
                <FaFilter className="w-3.5 h-3.5" />
                Filtres
                {hasActiveFilters && (
                  <span className="bg-site-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="lg:col-span-2">
                  <Label className="text-xs font-medium mb-1 block">Recherche</Label>
                  <div className="relative">
                    <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Utilisateur, message, module..." value={filters.search}
                      onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                      className="pl-7 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Niveau</Label>
                  <Select value={filters.level || "all"} onValueChange={(v) => setFilters(f => ({ ...f, level: v === "all" ? "" : v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      {["DEBUG","INFO","WARNING","ERROR","CRITICAL"].map(l => (
                        <SelectItem key={l} value={l}>
                          <LevelBadge level={l} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Action</Label>
                  <Select value={filters.action || "all"} onValueChange={(v) => { setFilters(f => ({ ...f, action: v === "all" ? "" : v })); setPage(1); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Toutes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Date début</Label>
                  <Input type="date" value={filters.date_from}
                    onChange={(e) => { setFilters(f => ({ ...f, date_from: e.target.value })); setPage(1); }}
                    className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Date fin</Label>
                  <Input type="date" value={filters.date_to}
                    onChange={(e) => { setFilters(f => ({ ...f, date_to: e.target.value })); setPage(1); }}
                    className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                <Button variant="outline" onClick={resetFilters} disabled={!hasActiveFilters} className="h-9 text-sm">
                  <FaTimes className="w-3 h-3 mr-1" /> Réinitialiser
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Entrées",      value: stats.total,    color: "text-gray-800" },
            { label: "Erreurs",      value: stats.errors,   color: stats.errors > 0 ? "text-red-600 font-bold" : "text-gray-400" },
            { label: "Avertissements",value: stats.warnings, color: stats.warnings > 0 ? "text-amber-600" : "text-gray-400" },
            { label: "Info",         value: stats.infos,    color: "text-blue-600" },
            { label: "Créations",    value: stats.creates,  color: "text-green-600" },
            { label: "Connexions",   value: stats.logins,   color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label} className={`bg-white border shadow-sm ${s.label === "Erreurs" && stats.errors > 0 ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
              <CardHeader className="pb-1 px-3 pt-3">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chargement des logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Aucun log trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Date</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Niveau</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Action</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Utilisateur</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Module / Logger</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">IP</th>
                      <th className="px-2 py-2.5 w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <LogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-3">
            <span className="text-xs text-gray-500">{total} entrées au total</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 text-xs">
                Précédent
              </Button>
              <span className="px-3 py-1 bg-gray-50 border rounded text-xs font-medium">
                {page} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PAGE_SIZE)} className="h-8 text-xs">
                Suivant
              </Button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
