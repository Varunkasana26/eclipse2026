export const computers = [
  { id: 1, name: 'GPU-NODE-01', specs: 'NVIDIA A100 80GB, 32 vCPU, 128GB RAM', status: 'free' },
  { id: 2, name: 'GPU-NODE-02', specs: 'NVIDIA H100 80GB, 64 vCPU, 256GB RAM', status: 'occupied' },
  { id: 3, name: 'GPU-NODE-03', specs: 'NVIDIA RTX 4090 24GB, 24 vCPU, 96GB RAM', status: 'free' },
  { id: 4, name: 'GPU-NODE-04', specs: 'NVIDIA L40S 48GB, 32 vCPU, 128GB RAM', status: 'occupied' },
  { id: 5, name: 'GPU-NODE-05', specs: 'NVIDIA T4 16GB, 16 vCPU, 64GB RAM', status: 'free' },
  { id: 6, name: 'GPU-NODE-06', specs: 'NVIDIA A10 24GB, 24 vCPU, 96GB RAM', status: 'free' },
  { id: 7, name: 'GPU-NODE-07', specs: 'NVIDIA A6000 48GB, 32 vCPU, 128GB RAM', status: 'occupied' },
  { id: 8, name: 'GPU-NODE-08', specs: 'NVIDIA V100 32GB, 24 vCPU, 96GB RAM', status: 'free' },
  { id: 9, name: 'GPU-NODE-09', specs: 'NVIDIA T4 16GB, 16 vCPU, 64GB RAM', status: 'free' },
  { id: 10, name: 'GPU-NODE-10', specs: 'NVIDIA RTX 6000 Ada 48GB, 32 vCPU, 128GB RAM', status: 'free' },
  { id: 11, name: 'GPU-NODE-11', specs: 'NVIDIA H100 80GB, 64 vCPU, 256GB RAM', status: 'occupied' },
  { id: 12, name: 'GPU-NODE-12', specs: 'NVIDIA A100 40GB, 32 vCPU, 128GB RAM', status: 'free' },
];

export const timeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export const initialBookings = [
  { id: 1, userId: 'user1', computerId: 2, date: '2026-04-01', timeSlot: '10:00 AM' },
  { id: 2, userId: 'user1', computerId: 4, date: '2026-04-01', timeSlot: '02:00 PM' },
  { id: 3, userId: 'user1', computerId: 7, date: '2026-04-01', timeSlot: '11:00 AM' },
  { id: 4, userId: 'other', computerId: 11, date: '2026-04-01', timeSlot: '09:00 AM' },
];

export const users = [
  { id: 'user1', email: 'student@lab.com', password: 'password123', name: 'John Doe' },
];
