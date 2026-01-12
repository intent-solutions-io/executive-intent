-- Executive Intent Database Schema
-- Migration 003: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- Helper function to get user_id from JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- Tenants policies
-- Only service role can manage tenants
CREATE POLICY "Service role can manage tenants"
  ON tenants FOR ALL
  USING (auth.role() = 'service_role');

-- Users policies
CREATE POLICY "Users can view own tenant users"
  ON users FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- Google connections policies
CREATE POLICY "Users can view own connections"
  ON google_connections FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can manage own connections"
  ON google_connections FOR ALL
  USING (tenant_id = auth.tenant_id() AND user_id = auth.user_id());

CREATE POLICY "Service role can manage all connections"
  ON google_connections FOR ALL
  USING (auth.role() = 'service_role');

-- Documents policies
CREATE POLICY "Users can view own tenant documents"
  ON documents FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Service role can manage documents"
  ON documents FOR ALL
  USING (auth.role() = 'service_role');

-- Document chunks policies
CREATE POLICY "Users can view own tenant chunks"
  ON document_chunks FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Service role can manage chunks"
  ON document_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- Audit events policies
-- Admins can view all tenant audit events
CREATE POLICY "Admins can view tenant audit events"
  ON audit_events FOR SELECT
  USING (
    tenant_id = auth.tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.user_id()
        AND users.role = 'admin'
    )
  );

-- Regular users can only view their own actions
CREATE POLICY "Users can view own audit events"
  ON audit_events FOR SELECT
  USING (
    tenant_id = auth.tenant_id()
    AND user_id = auth.user_id()
  );

CREATE POLICY "Service role can manage audit events"
  ON audit_events FOR ALL
  USING (auth.role() = 'service_role');

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT ON tenants TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON google_connections TO authenticated;
GRANT SELECT ON documents TO authenticated;
GRANT SELECT ON document_chunks TO authenticated;
GRANT SELECT ON audit_events TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
