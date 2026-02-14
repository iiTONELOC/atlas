import type {ApolloServer} from '@apollo/server';
import {HeaderMap} from '@apollo/server';

export async function handleGraphQLRequest(
  req: Request,
  apolloServer: ApolloServer,
  dataSource: any,
): Promise<Response> {
  const url = new URL(req.url);

  const headersMap = new HeaderMap();
  req.headers.forEach((value, key) => {
    headersMap.set(key, value);
  });

  const result = await apolloServer.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method.toUpperCase(),
      headers: headersMap,
      body: await req.text(),
      search: url.search,
    },
    context: async () => ({
      dataSource,
    }),
  });

  const {status = 200, headers, body} = result;

  const responseHeaders = new Headers();
  for (const [key, value] of headers) {
    responseHeaders.set(key, value);
  }

  if (body.kind === 'complete') {
    return new Response(body.string, {
      status,
      headers: responseHeaders,
    });
  }

  // Handle chunked/streamed responses
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of body.asyncIterator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    }),
    {
      status,
      headers: responseHeaders,
    },
  );
}
