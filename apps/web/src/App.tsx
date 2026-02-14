import {gql} from '@apollo/client';
import {useQuery} from '@apollo/client/react';
import {ReactNode} from 'react';

interface HelloQueryResult {
  hello: string;
}

const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

function App(): ReactNode {
  const {loading, error, data} = useQuery<HelloQueryResult>(HELLO_QUERY);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-4">TrashScanner™</h1>
      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}
      {data?.hello && (
        <div className="space-y-2">
          <p>{data.hello}</p>
          <p className="text-green-600">✓ Connected to GraphQL API</p>
        </div>
      )}
    </div>
  );
}

export default App;
