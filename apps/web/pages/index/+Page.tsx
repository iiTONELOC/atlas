import {gql} from '@apollo/client';
import {useQuery} from '@apollo/client/react';

interface HelloQueryResult {
  hello: string;
}

const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

export default function Page() {
  const {loading, error, data} = useQuery<HelloQueryResult>(HELLO_QUERY);

  return (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">TrashScanner™</h1>
        <a className="text-sm text-blue-600 underline" href="/about">
          About
        </a>
      </div>
      <p className="mt-2 text-gray-600">Home page</p>
      {loading && <p className="mt-4 text-gray-600">Loading...</p>}
      {error && <p className="mt-4 text-red-600">Error: {error.message}</p>}
      {data?.hello && (
        <div className="mt-4 space-y-2">
          <p>{data.hello}</p>
          <p className="text-green-600">✓ Connected to GraphQL API</p>
        </div>
      )}
    </div>
  );
}
