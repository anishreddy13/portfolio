import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { fetchMlHealth, fetchSkinHealth } from "../../lib/mlApi";
import type {
  DriftReport,
  ModelVersion,
  PipelineRun,
  Prediction,
  ServiceHealth,
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
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    renderApi: "checking",
    skinApi: "checking",
    worker: "checking",
    supabase: "checking",
  });

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

      const lastPredictionAt = predData?.[0]?.processed_at;
      const lastActivityAt = activityData?.[0]?.created_at;
      const predictionAgeMinutes = lastPredictionAt
        ? (Date.now() - new Date(lastPredictionAt).getTime()) / 60000
        : Number.POSITIVE_INFINITY;

      setServiceHealth((prev) => ({
        ...prev,
        worker: predictionAgeMinutes <= 15 ? "online" : (count || 0) > 0 ? "stale" : "offline",
        supabase: (count || 0) > 0 || !!lastActivityAt ? "online" : "stale",
        lastPredictionAt,
        lastActivityAt,
      }));
    } catch (e) {
      console.error("Fetch failed:", e);
      setServiceHealth((prev) => ({
        ...prev,
        supabase: "offline",
        worker: "offline",
      }));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const checkServices = useCallback(async () => {
    setServiceHealth((prev) => ({
      ...prev,
      renderApi: "checking",
      skinApi: "checking",
    }));

    const [renderResult, skinResult] = await Promise.allSettled([
      fetchMlHealth(),
      fetchSkinHealth(),
    ]);

    setServiceHealth((prev) => ({
      ...prev,
      renderApi: renderResult.status === "fulfilled" && renderResult.value.ok ? "online" : "offline",
      skinApi: skinResult.status === "fulfilled" && skinResult.value.ok ? "online" : "offline",
      checkedAt: new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    fetchData(page);
    checkServices();

    const predChannel = supabase.channel("pred_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news_predictions" }, (payload) => {
        const prediction = payload.new as Prediction;
        setPredictions((prev) => [prediction, ...prev.slice(0, pageSize - 1)]);
        setTotal((prev) => prev + 1);
        setServiceHealth((prev) => ({
          ...prev,
          worker: "online",
          supabase: "online",
          lastPredictionAt: prediction.processed_at,
        }));
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
  }, [addToast, checkServices, fetchData, page, pageSize]);

  return {
    predictions,
    modelVersions,
    driftReports,
    userActivity,
    pipelineRuns,
    total,
    loading,
    serviceHealth,
    refreshServices: checkServices,
  };
}
