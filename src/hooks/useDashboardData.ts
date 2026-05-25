import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type {
  DriftReport,
  ModelVersion,
  PipelineRun,
  Prediction,
  Toast,
  UserActivity,
} from "@/types/dashboard";

type AddToast = (toast: Omit<Toast, "id">) => void;

export function useDashboardData(
  page: number,
  pageSize: number,
  addToast: AddToast
) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [driftReports, setDriftReports] = useState<DriftReport[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const { count } = await supabase
        .from("news_predictions")
        .select("*", { count: "exact", head: true });
      setTotal(count || 0);

      const from = (pageNum - 1) * pageSize;
      const { data: predData } = await supabase
        .from("news_predictions")
        .select("*")
        .order("processed_at", { ascending: false })
        .range(from, from + pageSize - 1);
      const { data: versionsData } = await supabase
        .from("model_versions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      const { data: driftData } = await supabase
        .from("drift_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: activityData } = await supabase
        .from("user_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const { data: pipelineData } = await supabase
        .from("pipeline_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setPredictions(predData || []);
      setModelVersions(versionsData || []);
      setDriftReports(driftData || []);
      setUserActivity(activityData || []);
      setPipelineRuns(pipelineData || []);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchData(page);

    const predChannel = supabase.channel("pred_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news_predictions" }, (payload) => {
        setPredictions((prev) => [payload.new as Prediction, ...prev.slice(0, pageSize - 1)]);
        setTotal((prev) => prev + 1);
      }).subscribe();

    const driftChannel = supabase.channel("drift_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "drift_reports" }, (payload) => {
        const r = payload.new as DriftReport;
        setDriftReports((prev) => [r, ...prev.slice(0, 19)]);
        if (r.drift_detected) {
          addToast({ type: "drift", title: "⚠️ Drift Detected", message: `${r.action_taken} · ${r.sample_size} samples`, color: "#FF2D2D" });
        }
      }).subscribe();

    const versionChannel = supabase.channel("version_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "model_versions" }, (payload) => {
        setModelVersions((prev) => [payload.new as ModelVersion, ...prev.slice(0, 9)]);
      }).subscribe();

    const activityChannel = supabase.channel("activity_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activity" }, (payload) => {
        setUserActivity((prev) => [payload.new as UserActivity, ...prev.slice(0, 199)]);
      }).subscribe();

    const pipelineChannel = supabase.channel("pipeline_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pipeline_runs" }, (payload) => {
        const r = payload.new as PipelineRun;
        setPipelineRuns((prev) => [r, ...prev.slice(0, 19)]);
        addToast({
          type: "pipeline",
          title: r.status === "success" ? "✅ Pipeline Passed" : "❌ Pipeline Failed",
          message: `Run #${r.run_number} · ${r.trigger}`,
          color: r.status === "success" ? "#C8FF00" : "#FF2D2D",
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(predChannel);
      supabase.removeChannel(driftChannel);
      supabase.removeChannel(versionChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(pipelineChannel);
    };
  }, [addToast, fetchData, page, pageSize]);

  return {
    predictions,
    modelVersions,
    driftReports,
    userActivity,
    pipelineRuns,
    total,
    loading,
  };
}
