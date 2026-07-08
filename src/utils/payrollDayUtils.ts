export const getMonthName = (monthIndex: number): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error('Month index must be between 0 and 11');
  }

  return months[monthIndex];
};
