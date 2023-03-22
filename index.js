const bent = require('bent')
const { abi } = require('thor-devkit')

const NODE_URL = process.env.NODE_URL || "https://mainnet.veblocks.net"
const EVENTS_PER_PAGE = 100
const TOPIC_CACHE = {}

const postNode = bent(NODE_URL, 'POST', 'json')
const lookupSignature = bent('https://sig.api.vechain.energy', 'GET', 'json')

const address = process.argv[2]

if (!address) {
  console.error('\nAddress is required\nyarn start <address>\n\n')
  process.exit(1)
}

async function decodeEventsFor(address) {
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

    for (const event of events) {
      const eventAbi = await signatureByTopic0(event.topics[0])

      if (!eventAbi) {
        continue
      }

      const abiCoder = new abi.Event(eventAbi)
      const decoded = abiCoder.decode(event.data, event.topics)
      console.log(`${eventAbi.name} (${eventAbi.inputs.map(({type, name}, index) => `${type} ${name} ${decoded[index]}`).join(', ')})`)
    }

    if (!events.length) {
      break
    }
  } while (true)

}


async function signatureByTopic0(topic) {
  if (TOPIC_CACHE[topic]) {
    return TOPIC_CACHE[topic]
  }

  const [lookup] = await lookupSignature(`/${topic}?event=true`)

  if (!lookup) {
    console.error(`No signature found for topic ${topic}`)
    return
  }

  TOPIC_CACHE[topic] = lookup.abi

  return TOPIC_CACHE[topic]
}

decodeEventsFor(address)
  .then(() => process.exit(0))
  .catch(err => console.error(err))