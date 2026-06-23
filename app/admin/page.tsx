import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const totalCustomers = await prisma.customer.count()
  const activeActivations = await prisma.activation.count({
    where: { status: 'active' },
  })
  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'success' },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="border p-4 rounded shadow">
          <h2>Total Users</h2>
          <p className="text-xl">{totalCustomers}</p>
        </div>
        <div className="border p-4 rounded shadow">
          <h2>Online Users</h2>
          <p className="text-xl">{activeActivations}</p>
        </div>
        <div className="border p-4 rounded shadow">
          <h2>Revenue</h2>
          <p className="text-xl">${totalRevenue._sum.amount || 0}</p>
        </div>
      </div>
    </div>
  )
}