import React, { useEffect, useState } from 'react';
import { api } from '../api';

const SetTable = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = 1; // Replace with actual user ID if needed
    api.get(`/sets?userId=${userId}`)
      .then(res => {
        console.log('Axios response:', res); // Print the Response object
        setSets(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Set ID</th>
          <th>Set Name</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {sets.map(set => {
          const percent = Math.round((set.ownedPieces / set.totalPieces) * 100);
          return (
            <tr key={set.id}>
              <td>{set.id}</td>
              <td>{set.name}</td>
              <td>
                <div style={{ width: 150, background: '#eee', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      background: '#4caf50',
                      height: 16,
                      borderRadius: 4,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </td>
              <td>
                <span style={{ marginLeft: 8 }}>
                  {set.ownedPieces} / {set.totalPieces}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default SetTable;