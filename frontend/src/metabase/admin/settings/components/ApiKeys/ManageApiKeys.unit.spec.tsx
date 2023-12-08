import userEvent from "@testing-library/user-event";
import fetchMock from "fetch-mock";

import { renderWithProviders, screen } from "__support__/ui";
import {
  setupApiKeyEndpoints,
  setupGroupsEndpoint,
} from "__support__/server-mocks";
import { ManageApiKeys } from "metabase/admin/settings/components/ApiKeys/ManageApiKeys";
import { createMockGroup } from "metabase-types/api/mocks";

const GROUPS = [
  createMockGroup(),
  createMockGroup({ id: 2, name: "Administrators" }),
  createMockGroup({ id: 3, name: "foo" }),
  createMockGroup({ id: 4, name: "bar" }),
  createMockGroup({ id: 5, name: "flamingos" }),
];

function setup() {
  setupGroupsEndpoint(GROUPS);
  setupApiKeyEndpoints([
    {
      name: "Development API Key",
      id: 1,
      group_id: 1,
      group_name: "All Users",
      creator_id: 1,
      masked_key: "asdfasdfa",
      created_at: "2010 Aug 10",
      updated_at: "2010 Aug 10",
    },
    {
      name: "Production API Key",
      id: 2,
      group_id: 2,
      group_name: "All Users",
      creator_id: 1,
      masked_key: "asdfasdfa",
      created_at: "2010 Aug 10",
      updated_at: "2010 Aug 10",
    },
  ]);
  renderWithProviders(<ManageApiKeys />);
}
describe("ManageApiKeys", () => {
  it("should render the component", async () => {
    setup();
    expect(screen.getByText("Manage API Keys")).toBeInTheDocument();
  });
  it("should load API keys from api", async () => {
    setup();
    expect(await screen.findByText("Development API Key")).toBeInTheDocument();
  });
  it("should create a new API key", async () => {
    setup();
    userEvent.click(screen.getByText("Create API Key"));
    expect(await screen.findByText("Create a new API Key")).toBeInTheDocument();
    userEvent.type(screen.getByLabelText(/Key name/), "New key");
    userEvent.click(screen.getByLabelText(/Select a group/));
    userEvent.click(await screen.findByText("flamingos"));
    userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Create a new API Key"),
    ).not.toBeInTheDocument();
    const lastRequest = await fetchMock
      .lastCall("path:/api/api-key", { method: "POST" })
      ?.request?.json();
    expect(lastRequest).toEqual({ name: "New key", group_id: 5 });
  });
});
