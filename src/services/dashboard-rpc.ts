import { supabase } from "@/lib/supabaseClient";

export async function rpcAvailabilityTotals(args: {
  p_client_id: string; p_from_date: string; p_to_date: string;
  p_region: string | null; p_city: string | null; p_store: string | null; p_team_leader_id: string | null;
}) {
  return supabase.rpc("get_availability_totals", args);
}

export async function rpcVisitCardsTotals(args: {
  p_client_id: string; p_from_date: string; p_to_date: string;
  p_region: string | null; p_city: string | null; p_store: string | null; p_team_leader_id: string | null;
}) {
  return supabase.rpc("get_visit_cards_totals", args);
}
