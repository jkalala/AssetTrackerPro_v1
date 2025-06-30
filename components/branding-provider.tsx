"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { Tenant } from "@/lib/rbac/types";

export interface Branding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
}

const BrandingContext = createContext<Branding | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<Branding>({});

  useEffect(() => {
    async function fetchBranding() {
      if (!user) return;
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, tenants(*)")
        .eq("id", user.id)
        .single();
      if (profile?.tenants) {
        setBranding({
          logoUrl: profile.tenants.branding_logo_url || undefined,
          primaryColor: profile.tenants.branding_primary_color || undefined,
          secondaryColor: profile.tenants.branding_secondary_color || undefined,
          companyName: profile.tenants.branding_company_name || profile.tenants.name || undefined,
        });
      }
    }
    fetchBranding();
  }, [user]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
} 