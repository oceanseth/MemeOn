// Approve a creator claim on an archive meme: transfers creatorship and the
// archive's remaining shares to the claimant.
//
// Usage: TABLE_NAME=memeon-dev SSM_PREFIX=/memeon/dev AWS_REGION=us-west-2 \
//          npx tsx scripts/approve-claim.ts <memeId> <claimantSub>
import * as db from '../src/db'

const [memeId, claimantSub] = process.argv.slice(2)
if (!memeId || !claimantSub) throw new Error('usage: approve-claim.ts <memeId> <claimantSub>')

const meme = await db.getMeme(memeId)
if (!meme) throw new Error('meme not found')
const claims = await db.listClaims(memeId)
const claim = claims.find((c) => c.userId === claimantSub)
if (!claim) throw new Error(`no claim by ${claimantSub}; claims: ${claims.map((c) => c.userId).join(', ') || 'none'}`)
const claimant = await db.getUser(claimantSub)
if (!claimant) throw new Error('claimant not found')

// transfer archive-held shares to the claimant
const positions = await db.getPositions(memeId)
const archivePos = positions.find((p) => p.userId === db.ARCHIVE_SUB)
const claimantPos = positions.find((p) => p.userId === claimantSub)
if (archivePos && archivePos.shares > 0) {
  await db.putPosition(memeId, claimantSub, (claimantPos?.shares ?? 0) + archivePos.shares)
  await db.putPosition(memeId, db.ARCHIVE_SUB, 0)
}
await db.updateMemeFields(memeId, {
  creatorId: claimantSub,
  creatorName: claimant.name,
  ownerId: claimantSub,
  ownerName: claimant.name,
})
// creatorship moved — move the created-by edge so profiles stay correct
await db.deleteCreatedEdge(meme.creatorId, meme.createdAt, memeId)
await db.putCreatedEdge(claimantSub, meme.createdAt, memeId)
await db.setClaimStatus(memeId, claimantSub, 'approved')
for (const other of claims.filter((c) => c.userId !== claimantSub)) {
  await db.setClaimStatus(memeId, other.userId, 'rejected')
}
await db.addAlert(
  claimantSub,
  'friend',
  `📼✅ Your creator claim on "${meme.title}" was approved — the card is yours!`,
  memeId,
)
console.log(`approved: ${meme.title} -> ${claimant.name} (${archivePos?.shares ?? 0} shares transferred)`)
process.exit(0)
