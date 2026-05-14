require 'csv'

CUSTOMER_ID = 76
OUT = '/tmp'

customer = Customer.find(CUSTOMER_ID)
puts "Customer ##{customer.id} — #{customer.name}"

def account_full_number(account)
  ana = account.analytical_number.to_s
  "#{account.general_number}#{ana.rjust(6, '0')}"
end

def first_iban(profile)
  profile.bank_accounts.first&.iban
end

# ---------------------------------------------------------------------------
# 1) OWNERS — comptes 411 (third-party landlord, allocation: nil)
# ---------------------------------------------------------------------------
# Un 411 peut être rattaché soit directement à un profile (cas solo),
# soit à un profile_contract_group (cas indivision ou owner-accounting post-flip).
# On dump une ligne par (compte 411 × profil propriétaire couvert).
# ---------------------------------------------------------------------------
owners_path = File.join(OUT, "rivage_owners_#{CUSTOMER_ID}.csv")
CSV.open(owners_path, 'w', force_quotes: true) do |csv|
  csv << %w[rivage_account profile_id full_name email iban nature scope]

  accounts = AccountingAccount
    .joins(:configuration_accounting_account)
    .where(customer_id: customer.id)
    .where(configuration_accounting_accounts: {
             holder_type: 'landlord', account_class: 'third_party', allocation: nil
           })
    .includes(:profile, profile_contract_group: { profiles: :bank_accounts })

  accounts.find_each do |a|
    profiles =
      if a.profile_id
        [a.profile].compact
      elsif a.profile_contract_group_id
        a.profile_contract_group.profiles.to_a
      else
        []
      end
    scope = a.profile_id ? 'profile' : (a.profile_contract_group_id ? 'pcg' : 'orphan')

    if profiles.empty?
      csv << [account_full_number(a), nil, nil, nil, nil, nil, scope]
    else
      profiles.each do |p|
        csv << [account_full_number(a), p.id, p.full_name, p.email, first_iban(p), p.nature, scope]
      end
    end
  end
end
puts "→ #{owners_path} (#{`wc -l < #{owners_path}`.strip} lignes)"

# ---------------------------------------------------------------------------
# 2) TENANTS — comptes 419 (third-party tenant, allocation: nil)
# ---------------------------------------------------------------------------
# Un 419 est rattaché à un leasing_contract. On résout le(s) profil(s) tenant
# du bail. Si plusieurs co-locataires, on émet plusieurs lignes.
# ---------------------------------------------------------------------------
tenants_path = File.join(OUT, "rivage_tenants_#{CUSTOMER_ID}.csv")
CSV.open(tenants_path, 'w', force_quotes: true) do |csv|
  csv << %w[rivage_account leasing_contract_id profile_id full_name email iban nature]

  accounts = AccountingAccount
    .joins(:configuration_accounting_account)
    .where(customer_id: customer.id)
    .where(configuration_accounting_accounts: {
             holder_type: 'tenant', account_class: 'third_party', allocation: nil
           })
    .includes(leasing_contract: { tenants: :bank_accounts })

  accounts.find_each do |a|
    lc = a.leasing_contract
    tenants = lc ? lc.tenants.to_a : []

    if tenants.empty?
      csv << [account_full_number(a), lc&.id, nil, nil, nil, nil, nil]
    else
      tenants.each do |t|
        csv << [account_full_number(a), lc.id, t.id, t.full_name, t.email, first_iban(t), t.nature]
      end
    end
  end
end
puts "→ #{tenants_path} (#{`wc -l < #{tenants_path}`.strip} lignes)"

# ---------------------------------------------------------------------------
# 3) SUPPLIERS — comptes 401 (third-party supplier)
# ---------------------------------------------------------------------------
# AccountingAccount.supplier_id pointe vers un Profile (classe Profile pour
# tous les rôles). On dump une ligne par compte 401.
# ---------------------------------------------------------------------------
suppliers_path = File.join(OUT, "rivage_suppliers_#{CUSTOMER_ID}.csv")
CSV.open(suppliers_path, 'w', force_quotes: true) do |csv|
  csv << %w[rivage_account profile_id full_name email iban nature]

  accounts = AccountingAccount
    .joins(:configuration_accounting_account)
    .where(customer_id: customer.id)
    .where(configuration_accounting_accounts: {
             holder_type: 'supplier', account_class: 'third_party'
           })
    .includes(supplier: :bank_accounts)

  accounts.find_each do |a|
    s = a.supplier
    if s.nil?
      csv << [account_full_number(a), nil, nil, nil, nil, nil]
    else
      csv << [account_full_number(a), s.id, s.full_name, s.email, first_iban(s), s.nature]
    end
  end
end
puts "→ #{suppliers_path} (#{`wc -l < #{suppliers_path}`.strip} lignes)"

puts "\nDone. Récupérer les fichiers depuis le pod :"
puts "  kubectl cp <pod>:#{owners_path} ./rivage_owners.csv"
puts "  kubectl cp <pod>:#{tenants_path} ./rivage_tenants.csv"
puts "  kubectl cp <pod>:#{suppliers_path} ./rivage_suppliers.csv"
