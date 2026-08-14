# Medusa.Ledger — .NET stub (roadmap)

v0.1: HTTP client against Medusa Docker sidecar. Native NuGet with SPEC hashes is v1.2.

## Planned

```bash
dotnet add package Medusa.Ledger
```

```csharp
var client = new MedusaLedgerClient("http://localhost:8080");
await client.AppendAsync("ORDER_CREATED", "order-001", new { amount = 50000, currency = "COP" });
var verify = await client.VerifyAsync();
Console.WriteLine(verify.Valid);
```

See `SPEC.md`. Do not implement independent hash logic until canonical rules are frozen in v1.1.
