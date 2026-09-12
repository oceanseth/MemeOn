import type { Meta, StoryObj } from "@storybook/react-vite";
import { Suspense } from "react";
import { createActor } from "xstate";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { meLou } from "../../.storybook/fixtures";
import { createRequestGuard } from "../../.storybook/request-accounting";
import { PENDING_VIDEO_KEY } from "../hooks/useCreateMemeScreen";
import { clearSession, setSessionToken } from "../lib/api";
import { authMachine } from "../stores/authMachine";
import { createStores } from "../stores/createStores";
import { StoresProvider } from "../stores/StoresContext";
import { CreateMemeRoute, InviteRoute } from "./AppView";
import { DiscordLinkView } from "./DiscordLinkView";

function pathOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.pathname;
  return input.url;
}

function CreateMemeRoutes() {
  return (
    <>
      <nav>
        <Link to="/binder/new?remix=remix-a">Remix A</Link>
        <Link to="/binder/new?remix=remix-b">Remix B</Link>
      </nav>
      {/* the mint view is code-split behind the app's auth gate, so the harness owns the boundary */}
      <Suspense fallback={<p>Loading the mint desk…</p>}>
        <Routes>
          <Route path="/binder/new" element={<CreateMemeRoute />} />
        </Routes>
      </Suspense>
    </>
  );
}

function InviteRoutes() {
  return (
    <>
      <nav>
        <Link to="/invite/inviter-a">Invite A</Link>
        <Link to="/invite/inviter-b">Invite B</Link>
      </nav>
      <Routes>
        <Route path="/invite/:sub" element={<InviteRoute />} />
        <Route path="/friends" element={<p>Friends</p>} />
      </Routes>
    </>
  );
}

function DiscordLinkRoutes() {
  return (
    <>
      <nav>
        <Link to="/discord/link?token=token-a">Token A</Link>
        <Link to="/discord/link?token=token-b">Token B</Link>
        <Link to="/discord/link?token=token-c">Token C</Link>
      </nav>
      <Routes>
        <Route path="/discord/link" element={<DiscordLinkView />} />
      </Routes>
    </>
  );
}

const meta = {
  title: "Views/AppView route inputs",
  component: CreateMemeRoutes,
  tags: ["!autodocs"],
  decorators: [
    (Story, context) => (
      <MemoryRouter
        initialEntries={
          context.parameters.initialEntries ?? ["/binder/new?remix=remix-a"]
        }
      >
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof CreateMemeRoutes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RemixRouteUsesCurrentSource: Story = {
  loaders: [
    () => {
      let resolveA!: (response: Response) => void;
      let resolveB!: (response: Response) => void;
      const sourceA = new Promise<Response>((resolve) => {
        resolveA = resolve;
      });
      const sourceB = new Promise<Response>((resolve) => {
        resolveB = resolve;
      });
      return {
        resolveA,
        resolveB,
        sourceA,
        sourceB,
        editBodies: [] as unknown[],
        mintBodies: [] as unknown[],
        requestGuard: createRequestGuard(),
      };
    },
  ],
  beforeEach: ({ loaded }) => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const path = pathOf(input);
      if (path === "/api/memes/remix-a") return loaded.sourceA;
      if (path === "/api/memes/remix-b") return loaded.sourceB;
      if (path === "/api/aigen/image-edit") {
        loaded.editBodies.push(JSON.parse(String(init?.body)));
        return Response.json({ imageUrl: "/remix-b.png" });
      }
      if (path === "/api/memes") {
        loaded.mintBodies.push(JSON.parse(String(init?.body)));
        return Response.json({ meme: { id: "minted-b" } });
      }
      return loaded.requestGuard.record(init?.method ?? "GET", path);
    };
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("link", { name: "Remix B" }));
    loaded.resolveB(
      Response.json({
        meme: {
          id: "remix-b",
          title: "source B",
          creatorName: "Bee",
          imageUrl: "/b.png",
        },
      }),
    );
    // the mint desk is a lazy chunk: on a cold shard its first load outruns the 1 s default
    await expect(
      await canvas.findByRole("img", { name: "source B" }, { timeout: 8000 }),
    ).toBeInTheDocument();

    loaded.resolveA(
      Response.json({
        meme: {
          id: "remix-a",
          title: "source A",
          creatorName: "Aye",
          imageUrl: "/a.png",
        },
      }),
    );
    await expect(
      canvas.getByRole("img", { name: "source B" }),
    ).toBeInTheDocument();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /Edit prompt/ }),
      "make it blue",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Remix image" }));
    await waitFor(() =>
      expect(loaded.editBodies).toEqual([
        expect.objectContaining({ imageUrls: ["/b.png"] }),
      ]),
    );
    await userEvent.click(canvas.getByRole("button", { name: /Mint/ }));
    await waitFor(() =>
      expect(loaded.mintBodies).toEqual([
        expect.objectContaining({ remixOf: "remix-b" }),
      ]),
    );
  },
};

export const PendingVideoStaysWithItsRemixRoute: Story = {
  parameters: { initialEntries: ["/binder/new?remix=remix-b"] },
  loaders: [() => ({ requestGuard: createRequestGuard() })],
  beforeEach: ({ loaded }) => {
    const originalFetch = window.fetch;
    sessionStorage.setItem(
      PENDING_VIDEO_KEY,
      JSON.stringify({
        generationId: "render-a",
        startedAt: Date.now(),
        imageUrl: "/pending-a.png",
        remixId: "remix-a",
      }),
    );
    window.fetch = async (input) => {
      const path = pathOf(input);
      if (path === "/api/memes/remix-a") {
        return Response.json({
          meme: {
            id: "remix-a",
            title: "source A",
            creatorName: "Aye",
            imageUrl: "/a.png",
          },
        });
      }
      if (path === "/api/memes/remix-b") {
        return Response.json({
          meme: {
            id: "remix-b",
            title: "source B",
            creatorName: "Bee",
            imageUrl: "/b.png",
          },
        });
      }
      return loaded.requestGuard.record("GET", path);
    };
    return () => {
      sessionStorage.removeItem(PENDING_VIDEO_KEY);
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // the mint desk is a lazy chunk: on a cold shard its first load outruns the 1 s default
    await expect(
      await canvas.findByRole("img", { name: "source B" }, { timeout: 8000 }),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("img", { name: /^Preview of/ }),
    ).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("link", { name: "Remix A" }));
    await expect(
      await canvas.findByRole("img", { name: "source A" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("img", { name: 'Preview of "source A"' }),
    ).toHaveAttribute("src", "/pending-a.png");
  },
};

export const LateVideoCompletionAfterRouteChangeKeepsPendingJob: Story = {
  parameters: { initialEntries: ["/binder/new?remix=remix-a"] },
  loaders: [
    () => {
      let resolveStatus!: (response: Response) => void;
      const status = new Promise<Response>((resolve) => {
        resolveStatus = resolve;
      });
      return { resolveStatus, status, statusRequests: 0, requestGuard: createRequestGuard() };
    },
  ],
  beforeEach: ({ loaded }) => {
    const originalFetch = window.fetch;
    sessionStorage.setItem(
      PENDING_VIDEO_KEY,
      JSON.stringify({
        generationId: "render-a",
        startedAt: Date.now(),
        imageUrl: "/pending-a.png",
        remixId: "remix-a",
      }),
    );
    window.fetch = async (input) => {
      const path = pathOf(input);
      if (path === "/api/memes/remix-a") {
        return Response.json({
          meme: {
            id: "remix-a",
            title: "source A",
            creatorName: "Aye",
            imageUrl: "/a.png",
          },
        });
      }
      if (path === "/api/memes/remix-b") {
        return Response.json({
          meme: {
            id: "remix-b",
            title: "source B",
            creatorName: "Bee",
            imageUrl: "/b.png",
          },
        });
      }
      if (path === "/api/aigen/video/render-a") {
        loaded.statusRequests += 1;
        return loaded.status;
      }
      return loaded.requestGuard.record("GET", path);
    };
    return () => {
      sessionStorage.removeItem(PENDING_VIDEO_KEY);
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("img", { name: "source A" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(loaded.statusRequests).toBe(1), {
      timeout: 7000,
    });

    await userEvent.click(canvas.getByRole("link", { name: "Remix B" }));
    loaded.resolveStatus(
      Response.json({ status: "video", videoUrl: "/finished-a.mp4" }),
    );
    await waitFor(() =>
      expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain("render-a"),
    );

    await userEvent.click(canvas.getByRole("link", { name: "Remix A" }));
    await expect(
      await canvas.findByRole("img", { name: "source A" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("img", { name: 'Preview of "source A"' }),
    ).toHaveAttribute("src", "/pending-a.png");
    await expect(
      canvas.getByText(/Resuming a video render/),
    ).toBeInTheDocument();
  },
};

export const InviteRouteUsesCurrentInviter: Story = {
  parameters: { initialEntries: ["/invite/inviter-a"] },
  loaders: [
    () => {
      const stores = createStores(createActor(authMachine));
      let resolveA!: (response: Response) => void;
      let resolveB!: (response: Response) => void;
      const sourceA = new Promise<Response>((resolve) => {
        resolveA = resolve;
      });
      const sourceB = new Promise<Response>((resolve) => {
        resolveB = resolve;
      });
      return {
        stores,
        resolveA,
        resolveB,
        sourceA,
        sourceB,
        acceptBodies: [] as unknown[],
        requestGuard: createRequestGuard(),
      };
    },
  ],
  beforeEach: async ({ loaded }) => {
    const originalFetch = window.fetch;
    setSessionToken("route-input-session");
    window.fetch = async (input, init) => {
      const path = pathOf(input);
      if (path === "/api/me") return Response.json(meLou);
      if (path === "/api/invite/inviter-a") return loaded.sourceA;
      if (path === "/api/invite/inviter-b") return loaded.sourceB;
      if (path === "/api/invites/accept") {
        loaded.acceptBodies.push(JSON.parse(String(init?.body)));
        return Response.json({});
      }
      return loaded.requestGuard.record(init?.method ?? "GET", path);
    };
    loaded.stores.retain();
    await loaded.stores.auth.refresh();
    return () => {
      loaded.stores.dispose();
      window.fetch = originalFetch;
      clearSession();
    };
  },
  render: (_args, { loaded }) => (
    <StoresProvider stores={loaded.stores}>
      <InviteRoutes />
    </StoresProvider>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("link", { name: "Invite B" }));
    loaded.resolveB(
      Response.json({
        inviter: {
          sub: "inviter-b",
          name: "Bee",
          picture: null,
          followers: 1,
          collectionSize: 2,
          portfolioValue: 3,
        },
        topMemes: [],
      }),
    );
    await expect(
      await canvas.findByRole("heading", { name: /Bee invited you/ }),
    ).toBeInTheDocument();

    loaded.resolveA(
      Response.json({
        inviter: {
          sub: "inviter-a",
          name: "Aye",
          picture: null,
          followers: 1,
          collectionSize: 2,
          portfolioValue: 3,
        },
        topMemes: [],
      }),
    );
    await expect(
      canvas.getByRole("heading", { name: /Bee invited you/ }),
    ).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole("button", { name: /Accept & befriend Bee/ }),
    );
    await waitFor(() =>
      expect(loaded.acceptBodies).toEqual([{ inviterId: "inviter-b" }]),
    );
  },
};

export const PendingDiscordLinkUsesLatestTokenOnce: Story = {
  parameters: { initialEntries: ["/discord/link?token=token-a"] },
  loaders: [
    () => {
      const stores = createStores(createActor(authMachine));
      let resolveMe!: (response: Response) => void;
      const me = new Promise<Response>((resolve) => {
        resolveMe = resolve;
      });
      return { stores, resolveMe, me, linkBodies: [] as unknown[], requestGuard: createRequestGuard() };
    },
  ],
  beforeEach: ({ loaded }) => {
    const originalFetch = window.fetch;
    setSessionToken("route-input-session");
    window.fetch = async (input, init) => {
      const path = pathOf(input);
      if (path === "/api/me") return loaded.me;
      if (path === "/api/discord/link") {
        loaded.linkBodies.push(JSON.parse(String(init?.body)));
        return Response.json({});
      }
      return loaded.requestGuard.record(init?.method ?? "GET", path);
    };
    loaded.stores.retain();
    return () => {
      loaded.stores.dispose();
      window.fetch = originalFetch;
      clearSession();
    };
  },
  render: (_args, { loaded }) => (
    <StoresProvider stores={loaded.stores}>
      <DiscordLinkRoutes />
    </StoresProvider>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("link", { name: "Token B" }));
    const refresh = loaded.stores.auth.refresh();
    loaded.resolveMe(Response.json(meLou));
    await refresh;
    // linking is opt-in now: the screen asks before it spends the token
    await userEvent.click(
      await canvas.findByRole("button", { name: "Connect Discord" }),
    );
    await waitFor(() =>
      expect(loaded.linkBodies).toEqual([{ token: "token-b" }]),
    );
    await expect(
      await canvas.findByRole("heading", { name: /Connected/ }),
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("link", { name: "Token C" }));
    await expect(loaded.linkBodies).toEqual([{ token: "token-b" }]);
  },
};
