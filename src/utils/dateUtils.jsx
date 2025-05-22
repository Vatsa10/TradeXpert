export const formatUTCDate = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  export const getCurrentUTCDateTime = () => {
    return formatUTCDate(new Date());
  };