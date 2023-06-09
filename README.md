For analytical approach or just for curiosity, it might be interesting to identify events that are emitted by a contract.

The snippets will show how to:

1. Load all events from a specific contract
2. Lookup an ABI definition from the event hash
3. Decode event information using the found ABI

# Load event data from specific contract

The thor-node API provides access to all emitted events at `/logs/event`. Looping until no events are returned, provides access to all data:

```js
const bent = require('bent')
const NODE_URL = "https://mainnet.veblocks.net"
const EVENTS_PER_PAGE = 1000

const postNode = bent(NODE_URL, 'POST', 'json')

async function fetchEvents(address) {
  let offset = 0
  do {
    const events = await postNode('/logs/event', {
      order: 'desc',
      options: {
        limit: EVENTS_PER_PAGE,
        offset
      },
      "criteriaSet": [{ address }],
    })

    offset += EVENTS_PER_PAGE

    console.log(events)

    if(!events.length) {
      break
    }
  } while (true)

}
```

An example event looks like this:

```json
{
    address: '0x0000000000000000000000000000456e65726779',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000e6e4b12097cd9588fcb96164cbdbcfba51bb35d3',
      '0x00000000000000000000000044bc93a8d3cefa5a6721723a2f8d2e4f7d480ba0'
    ],
    data: '0x000000000000000000000000000000000000000000000000523986e1ffcd3400',
    meta: {
      blockID: '0x00e341410a38f1e1675174639b020b6515bb1e09e11a57d2bb622228d2d0c235',
      blockNumber: 14893377,
      blockTimestamp: 1679457330,
      txID: '0xd0ac0a1fa26b27ada3d9ce912747c9801998689f374d940d1d44b77fa4d5e99d',
      txOrigin: '0xe6e4b12097cd9588fcb96164cbdbcfba51bb35d3',
      clauseIndex: 0
    }
  }
```

The first entry in the topics is a hash of the event signature that is unique for every event.

# Lookup an ABI definition from event hash

The first entry of the topics (`topics[0]`) can be used to lookup the original ABI in a database.

[B32](https://github.com/vechain/b32) is the priority source for this within the vechain ecosystem.

[sig.api.vechain.energy](https://sig.api.vechain.energy) leverages it and sources from other ecosystems.

With the sig.api the lookup can be done:

```js
async function signatureByTopic0(topic) {
  const [lookup] = await lookupSignature(`/${topic}?event=true`)

  if (!lookup) {
    console.error(`No signature found for topic ${topic}`)
    return
  }

  return lookup.abi
}
```

The same API can be used for looking up function calls and decode complete function calls with parameters.


# Decode event information using the found ABI

[`thor-devkit`](https://www.npmjs.com/package/thor-devkit) brings the ability to handling ABI and data decoding with it.

Instantiating an ABI-Event and using its decode function provides needed decoding:

```js
const { abi } = require('thor-devkit')

const abiCoder = new abi.Event(eventAbi)
const decoded = abiCoder.decode(event.data, event.topics)
console.log(event.meta.txID, eventAbi.name, JSON.stringify(decoded))
```

# Sandbox + Complete Snippet

The complete snippet is available on GitHub:  
https://github.com/vechain-energy/sample-event-lookup

A Sandbox version using Websockets to demonstrate decoding for live events is available here:  
https://codesandbox.io/s/decode-unknown-events-from-contracts-d9xfjt

