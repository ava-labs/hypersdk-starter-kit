import { useState } from 'react';
import AddLiquidity from '../components/AddLiquidity';
import RemoveLiquidity from '../components/RemoveLiquidity';
import CreatePair from '../components/CreatePair';
import { Tab } from '@headlessui/react'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

interface PoolProps {
  tokens: string[];
  onAddToken: (newToken: string) => void;
}

const Pool: React.FC<PoolProps> = ({ tokens, onAddToken }) => {

    const [categories] = useState({
        'Create Pair': [],
        'Add Liquidity': [],
        'Remove Liquidity': []
      })

    return (
        
  <div>
      <div className="w-full max-w-md px-2 py-8 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-0.5">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-md py-1.5 text-xs font-medium leading-4',
                  'ring-white ring-opacity-60 ring-offset-1 ring-offset-gray-200 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-gray-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {Object.values(categories).map((posts, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-lg bg-white p-2',
                'ring-white ring-opacity-60 ring-offset-1 ring-offset-gray-200 focus:outline-none focus:ring-2'
              )}
            >
              <div className="text-xs text-gray-500">
                {Object.keys(categories)[idx] === 'Add Liquidity' && <AddLiquidity tokens={tokens} onAddToken={onAddToken}/>}
                {Object.keys(categories)[idx] === 'Remove Liquidity' && <RemoveLiquidity />}
                {Object.keys(categories)[idx] === 'Create Pair' && <CreatePair tokens={tokens} onAddToken={onAddToken}/>}

              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  </div>
  );
}

export default Pool;