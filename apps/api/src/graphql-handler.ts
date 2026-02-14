import type {ApolloServer} from '@apollo/server';
import {HeaderMap} from '@apollo/server';

export async function handleGraphQLRequest(
  req: Request,
  apolloServer: ApolloServer,
  dataSource: any,
): Promise<Response> {
  const url = new URL(req.url);
  const contentType = req.headers.get('content-type') ?? '';

  const headersMap = new HeaderMap();
  req.headers.forEach((value, key) => {
    headersMap.set(key, value);
  });

  let body: unknown = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const rawBody = await req.text();
    if (rawBody.trim() !== '') {
      if (contentType.includes('application/json')) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }
      } else if (contentType.includes('application/graphql')) {
        body = {query: rawBody};
      } else {
        body = rawBody;
      }
    }
  }

  const result = await apolloServer.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method.toUpperCase(),
      headers: headersMap,
      body,
      search: url.search,
    },
    context: async () => ({
      dataSource,
    }),
  });

  const {status = 200, headers, body: responseBody} = result;

  const responseHeaders = new Headers();
  for (const [key, value] of headers) {
    responseHeaders.set(key, value);
  }

  if (responseBody.kind === 'complete') {
    return new Response(responseBody.string, {
      status,
      headers: responseHeaders,
    });
  }

  // Handle chunked/streamed responses
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of responseBody.asyncIterator) {
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
