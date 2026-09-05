export async function generateMetadata({ params }) {

  const { district = "jaipur" } = await params;

  const districtName = district
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const url = `https://.com/${district}`;

  return {
    title: `Biomedical & Diagnostic Equipment Supplier in ${districtName} | Raj Biomedical`,

    description: `Raj Biomedical supplies diagnostic machines, laboratory equipment, reagents and biomedical products in ${districtName}.`,

    keywords: [
      `Biomedical Equipment ${districtName}`,
      `Diagnostic Machines ${districtName}`,
      `Laboratory Equipment ${districtName}`,
      `Pathology Equipment ${districtName}`,
      `Biomedical Supplier ${districtName}`,
    ],

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: url,
    },

    openGraph: {
      title: `Biomedical Equipment in ${districtName}`,
      description: `Diagnostic laboratory equipment supplier in ${districtName}.`,
      url,
      type: "website",
    },
  };
}

export default function DistrictLayout({ children }) {
  return children;
}